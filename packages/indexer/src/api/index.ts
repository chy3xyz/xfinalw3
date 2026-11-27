import { db } from "bponder:api"
import schema from "bponder:schema"
import { desc } from "bponder"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { graphql } from "bponder"
import { counterConfigured } from "../counterConfigured"
import { warnIndexerApiEnv } from "./assertEnv"
import { mountAdminAuth, requireAdmin } from "./adminAuth"
import { graphqlGuard } from "./graphqlGuard"
import { mountRpcProxy } from "./rpcProxy"

warnIndexerApiEnv()

const app = new Hono()

const CONTRACTS_CONFIGURED = counterConfigured()

function resolveCorsOrigin(origin: string): string | null {
  const whitelist = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (whitelist.length === 0) return "*"
  return whitelist.includes(origin) ? origin : null
}

app.use("*", cors({ origin: resolveCorsOrigin, credentials: true }))
app.use("*", graphqlGuard)

mountAdminAuth(app)
mountRpcProxy(app)

app.use("/graphql", graphql({ db, schema }))

/** Latest indexed Counter value (0 if none yet). */
app.get("/count", async (c) => {
  try {
    const rows = await db
      .select({ newCount: schema.countUpdate.newCount })
      .from(schema.countUpdate)
      .orderBy(desc(schema.countUpdate.blockNumber))
      .limit(1)
    const value = rows[0]?.newCount ?? 0n
    return c.text(value.toString())
  } catch {
    return c.text("0")
  }
})

/** Example protected admin read — extend with product routes. */
app.get("/admin/ping", requireAdmin, (c) => {
  return c.json({ ok: true, ts: new Date().toISOString() })
})

/**
 * Honest health — not always ok.
 * `/health` `/ready` `/status` `/metrics` are reserved by Bun-native bponder.
 */
app.get("/app/ready", async (c) => {
  const dbOk = Boolean(db) && Boolean(schema)
  const ready = CONTRACTS_CONFIGURED && dbOk
  const status = ready
    ? "ok"
    : !CONTRACTS_CONFIGURED
      ? "degraded"
      : "error"

  return c.json(
    {
      status,
      ready,
      contractsConfigured: CONTRACTS_CONFIGURED ? 1 : 0,
      db: dbOk ? "up" : "down",
      note: !CONTRACTS_CONFIGURED
        ? "COUNTER_ADDRESS empty — contract indexing disabled (Heartbeat only)"
        : undefined
    },
    ready ? 200 : 503
  )
})

export default app

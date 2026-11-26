import { db } from "bponder:api"
import schema from "bponder:schema"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { graphql } from "bponder"
import { getAddress } from "viem"
import { mountAdminAuth, requireAdmin } from "./adminAuth"
import { graphqlGuard } from "./graphqlGuard"
import { mountRpcProxy } from "./rpcProxy"

const app = new Hono()

/**
 * Keep in sync with indexing sources in ponder.config.ts
 * (contracts + blocks). Zero = scaffold stub.
 */
const CONTRACTS_CONFIGURED = 1 // Heartbeat blocks in ponder.config.ts

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

app.get("/count", async (c) => {
  return c.text("0")
})

app.get("/count/:address", async (c) => {
  const account = getAddress(c.req.param("address"))
  void account
  return c.text("0")
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
  const ready = CONTRACTS_CONFIGURED > 0 && dbOk
  const status = ready
    ? "ok"
    : CONTRACTS_CONFIGURED === 0
      ? "degraded"
      : "error"

  return c.json(
    {
      status,
      ready,
      contractsConfigured: CONTRACTS_CONFIGURED,
      db: dbOk ? "up" : "down",
      note:
        CONTRACTS_CONFIGURED === 0
          ? "No contracts in ponder.config.ts — indexer is a scaffold stub"
          : undefined
    },
    ready ? 200 : 503
  )
})

export default app

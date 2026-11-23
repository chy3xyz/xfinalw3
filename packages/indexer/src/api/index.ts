import { db } from "ponder:api"
import schema from "ponder:schema"
import { Hono } from "hono"
import { graphql } from "ponder"
import { getAddress } from "viem"

const app = new Hono()

/**
 * Keep in sync with `contracts` keys in ponder.config.ts.
 * Empty = scaffold stub (not indexing on-chain data yet).
 */
const CONTRACTS_CONFIGURED = 0

app.use("/graphql", graphql({ db, schema }))

app.get("/count", async (c) => {
  return c.text("0")
})

app.get("/count/:address", async (c) => {
  const account = getAddress(c.req.param("address"))
  void account
  return c.text("0")
})

/**
 * Honest health — not always ok.
 * No configured contracts → degraded / ready:false (HTTP 503).
 */
app.get("/health", async (c) => {
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

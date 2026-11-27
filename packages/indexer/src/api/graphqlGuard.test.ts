import { afterEach, describe, expect, test } from "bun:test"
import { Hono } from "hono"
import { graphqlGuard } from "./graphqlGuard"

const KEYS = [
  "NODE_ENV",
  "BPONDER_ENV",
  "GRAPHQL_API_KEY",
  "GRAPHQL_REQUIRE_API_KEY"
] as const
const saved: Record<string, string | undefined> = {}

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) process.env[k] = undefined
    else process.env[k] = saved[k]
  }
})

function stash() {
  for (const k of KEYS) saved[k] = process.env[k]
}

function mount() {
  const app = new Hono()
  app.use("*", graphqlGuard)
  app.get("/graphql", (c) => c.json({ ok: true }))
  app.post("/graphql", (c) => c.json({ ok: true }))
  app.get("/count", (c) => c.json({ ok: true }))
  return app
}

describe("graphqlGuard", () => {
  test("non-graphql paths pass through", async () => {
    stash()
    process.env.NODE_ENV = "production"
    process.env.GRAPHQL_API_KEY = undefined
    process.env.GRAPHQL_REQUIRE_API_KEY = "1"
    const app = mount()
    const res = await app.request("http://localhost/count")
    expect(res.status).toBe(200)
  })

  test("production without GRAPHQL_API_KEY → 503", async () => {
    stash()
    process.env.NODE_ENV = "production"
    process.env.BPONDER_ENV = undefined
    process.env.GRAPHQL_API_KEY = ""
    process.env.GRAPHQL_REQUIRE_API_KEY = undefined
    const app = mount()
    const res = await app.request("http://localhost/graphql")
    expect(res.status).toBe(503)
  })

  test("wrong api key → 401", async () => {
    stash()
    process.env.NODE_ENV = "development"
    process.env.GRAPHQL_REQUIRE_API_KEY = "0"
    process.env.GRAPHQL_API_KEY = "secret-key"
    const app = mount()
    const res = await app.request("http://localhost/graphql", {
      headers: { "x-api-key": "wrong" }
    })
    expect(res.status).toBe(401)
  })

  test("correct api key → 200", async () => {
    stash()
    process.env.NODE_ENV = "development"
    process.env.GRAPHQL_REQUIRE_API_KEY = "0"
    process.env.GRAPHQL_API_KEY = "secret-key"
    const app = mount()
    const res = await app.request("http://localhost/graphql", {
      headers: { "x-api-key": "secret-key" }
    })
    expect(res.status).toBe(200)
  })

  test("GRAPHQL_REQUIRE_API_KEY=0 allows open graphql in prod", async () => {
    stash()
    process.env.NODE_ENV = "production"
    process.env.GRAPHQL_API_KEY = ""
    process.env.GRAPHQL_REQUIRE_API_KEY = "0"
    const app = mount()
    const res = await app.request("http://localhost/graphql")
    expect(res.status).toBe(200)
  })
})

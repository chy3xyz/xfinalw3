import { describe, expect, test } from "bun:test"
import { Hono } from "hono"
import { newRequestId, requestLog, resolveRequestId } from "./requestLog"

describe("requestLog helpers", () => {
  test("newRequestId is hex length 16", () => {
    expect(newRequestId()).toMatch(/^[0-9a-f]{16}$/)
  })

  test("resolveRequestId keeps valid inbound", () => {
    expect(resolveRequestId("abc_DEF-12.34")).toBe("abc_DEF-12.34")
  })

  test("resolveRequestId replaces junk", () => {
    const id = resolveRequestId("bad id")
    expect(id).toMatch(/^[0-9a-f]{16}$/)
  })

  test("middleware sets X-Request-Id on response", async () => {
    const app = new Hono()
    app.use("*", requestLog)
    app.get("/ping", (c) => c.json({ ok: true, id: c.get("requestId") }))
    const res = await app.request("http://localhost/ping", {
      headers: { "x-request-id": "client-req-001" }
    })
    expect(res.status).toBe(200)
    expect(res.headers.get("x-request-id")).toBe("client-req-001")
    const body = (await res.json()) as { id: string }
    expect(body.id).toBe("client-req-001")
  })
})

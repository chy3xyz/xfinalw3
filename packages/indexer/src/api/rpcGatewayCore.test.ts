import { describe, expect, test } from "bun:test"
import {
  BLOCKED_PREFIXES,
  classifyMethods,
  makeLimiter,
  methodWeight,
  parseRpcBody,
  rejectReason,
  requestCost
} from "./rpcGatewayCore"

const body = (obj: unknown) => JSON.stringify(obj)

describe("rpcGatewayCore", () => {
  test("parseRpcBody single/batch/malformed", () => {
    expect(
      parseRpcBody(body({ jsonrpc: "2.0", id: 1, method: "eth_chainId" })).ok
    ).toBe(true)
    const b = parseRpcBody(
      body([{ method: "eth_call" }, { method: "eth_getLogs" }])
    )
    expect(b.ok).toBe(true)
    if (b.ok) {
      expect(b.isBatch).toBe(true)
      expect(b.methods).toEqual(["eth_call", "eth_getLogs"])
    }
    expect(parseRpcBody("{oops").ok).toBe(false)
    expect(parseRpcBody(body({ id: 1 })).ok).toBe(false)
    expect(parseRpcBody("[]").ok).toBe(false)
  })

  test("blocked prefixes", () => {
    const { blocked, unknown } = classifyMethods([
      "debug_traceTransaction",
      "txpool_content",
      "eth_call"
    ])
    expect(blocked).toEqual(["debug_traceTransaction", "txpool_content"])
    expect(unknown).toEqual([])
    expect(BLOCKED_PREFIXES).toContain("debug_")
  })

  test("unknown methods + allowUnknown", () => {
    const unknown = parseRpcBody(body([{ method: "eth_newFilter" }]))
    expect(rejectReason(unknown, { allowUnknown: true })).toBeNull()
    expect(rejectReason(unknown, { allowUnknown: false })?.message).toMatch(
      /method not allowed/
    )
  })

  test("batch too large", () => {
    const many = parseRpcBody(
      body(Array.from({ length: 51 }, () => ({ method: "eth_call" })))
    )
    expect(rejectReason(many, { maxBatch: 50 })?.message).toMatch(
      /batch too large/
    )
    expect(rejectReason(many, { maxBatch: 100 })).toBeNull()
  })

  test("weighted cost + limiter", () => {
    expect(methodWeight("eth_getLogs")).toBe(5)
    expect(requestCost(["eth_call", "eth_getLogs"])).toBe(6)
    const lim = makeLimiter({ perMin: 60, burst: 5 })
    const t0 = 1_000_000
    for (let i = 0; i < 5; i++) expect(lim.take("1.1.1.1", 1, t0).ok).toBe(true)
    expect(lim.take("1.1.1.1", 1, t0).ok).toBe(false)
    expect(lim.take("1.1.1.1", 1, t0 + 1000).ok).toBe(true)
    expect(lim.take("2.2.2.2", 1, t0).ok).toBe(true)
  })
})

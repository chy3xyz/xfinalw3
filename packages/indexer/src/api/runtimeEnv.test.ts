import { afterEach, describe, expect, test } from "bun:test"
import {
  graphqlApiKeyRequired,
  isProductionRuntime,
  rpcAllowUnknownMethods
} from "./runtimeEnv"

const KEYS = [
  "NODE_ENV",
  "BPONDER_ENV",
  "GRAPHQL_REQUIRE_API_KEY",
  "RPC_GATEWAY_ALLOW_UNKNOWN"
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

describe("runtimeEnv", () => {
  test("isProductionRuntime from NODE_ENV / BPONDER_ENV", () => {
    stash()
    process.env.NODE_ENV = "development"
    process.env.BPONDER_ENV = undefined
    expect(isProductionRuntime()).toBe(false)
    process.env.NODE_ENV = "production"
    expect(isProductionRuntime()).toBe(true)
    process.env.NODE_ENV = "development"
    process.env.BPONDER_ENV = "production"
    expect(isProductionRuntime()).toBe(true)
  })

  test("graphqlApiKeyRequired defaults to prod-only", () => {
    stash()
    process.env.NODE_ENV = "development"
    process.env.GRAPHQL_REQUIRE_API_KEY = undefined
    expect(graphqlApiKeyRequired()).toBe(false)
    process.env.NODE_ENV = "production"
    expect(graphqlApiKeyRequired()).toBe(true)
    process.env.GRAPHQL_REQUIRE_API_KEY = "0"
    expect(graphqlApiKeyRequired()).toBe(false)
    process.env.NODE_ENV = "development"
    process.env.GRAPHQL_REQUIRE_API_KEY = "1"
    expect(graphqlApiKeyRequired()).toBe(true)
  })

  test("rpcAllowUnknownMethods defaults allow in dev, deny in prod", () => {
    stash()
    process.env.NODE_ENV = "development"
    process.env.RPC_GATEWAY_ALLOW_UNKNOWN = undefined
    expect(rpcAllowUnknownMethods()).toBe(true)
    process.env.NODE_ENV = "production"
    expect(rpcAllowUnknownMethods()).toBe(false)
    process.env.RPC_GATEWAY_ALLOW_UNKNOWN = "1"
    expect(rpcAllowUnknownMethods()).toBe(true)
    process.env.RPC_GATEWAY_ALLOW_UNKNOWN = "0"
    process.env.NODE_ENV = "development"
    expect(rpcAllowUnknownMethods()).toBe(false)
  })
})

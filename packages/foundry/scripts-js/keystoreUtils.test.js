import { describe, expect, test } from "bun:test"
import {
  LOCAL_ANVIL_ACCOUNT,
  assertValidKeystoreName,
  keystoresDir
} from "./keystoreUtils.js"

describe("assertValidKeystoreName", () => {
  test("accepts normal names", () => {
    expect(assertValidKeystoreName("my-deployer")).toBe("my-deployer")
    expect(assertValidKeystoreName("Prod_1")).toBe("Prod_1")
    expect(assertValidKeystoreName("a")).toBe("a")
  })

  test("rejects empty / path / reserved", () => {
    expect(() => assertValidKeystoreName("")).toThrow()
    expect(() => assertValidKeystoreName("../etc")).toThrow()
    expect(() => assertValidKeystoreName("foo/bar")).toThrow()
    expect(() => assertValidKeystoreName("bad name")).toThrow()
    expect(() => assertValidKeystoreName(LOCAL_ANVIL_ACCOUNT)).toThrow(
      /reserved/
    )
  })

  test("allows reserved when opted in", () => {
    expect(
      assertValidKeystoreName(LOCAL_ANVIL_ACCOUNT, { allowReserved: true })
    ).toBe(LOCAL_ANVIL_ACCOUNT)
  })
})

describe("keystoresDir", () => {
  test("honors FOUNDRY_KEYSTORE_DIR", () => {
    const prev = process.env.FOUNDRY_KEYSTORE_DIR
    process.env.FOUNDRY_KEYSTORE_DIR = "/tmp/test-keystores"
    expect(keystoresDir()).toBe("/tmp/test-keystores")
    if (prev === undefined) process.env.FOUNDRY_KEYSTORE_DIR = undefined
    else process.env.FOUNDRY_KEYSTORE_DIR = prev
  })
})

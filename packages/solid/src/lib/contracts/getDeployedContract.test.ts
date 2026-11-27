import { describe, expect, test } from "bun:test"
import { getDeployedContract } from "./index"

describe("getDeployedContract", () => {
  test("resolves Counter on local foundry chain", () => {
    const c = getDeployedContract({ contractName: "Counter", chainId: 31337 })
    expect(c).not.toBeNull()
    expect(c?.address).toMatch(/^0x[0-9a-fA-F]{40}$/)
    expect(Array.isArray(c?.abi)).toBe(true)
  })

  test("returns null for unknown chain/name", () => {
    expect(
      getDeployedContract({ contractName: "Counter", chainId: 1 })
    ).toBeNull()
    expect(
      getDeployedContract({ contractName: "Nope", chainId: 31337 })
    ).toBeNull()
  })
})

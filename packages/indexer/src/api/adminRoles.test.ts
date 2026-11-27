import { describe, expect, test } from "bun:test"
import {
  ROLE_RANK,
  isAdminRole,
  parseAdminAccounts,
  roleAtLeast
} from "./adminRoles"

describe("adminRoles", () => {
  test("ROLE_RANK ordering", () => {
    expect(ROLE_RANK.viewer).toBeLessThan(ROLE_RANK.operator)
    expect(ROLE_RANK.operator).toBeLessThan(ROLE_RANK.owner)
  })

  test("roleAtLeast", () => {
    expect(roleAtLeast("owner", "viewer")).toBe(true)
    expect(roleAtLeast("viewer", "operator")).toBe(false)
    expect(roleAtLeast("operator", "operator")).toBe(true)
  })

  test("isAdminRole", () => {
    expect(isAdminRole("owner")).toBe(true)
    expect(isAdminRole("admin")).toBe(false)
  })

  test("parseAdminAccounts from ADMIN_ACCOUNTS", () => {
    const hash = "a".repeat(64)
    const map = parseAdminAccounts({
      ADMIN_PASSWORD_SHA256: "",
      ADMIN_ACCOUNTS: `alice:${hash}:operator;bob:${hash}:viewer`
    })
    expect(map.get("alice")?.role).toBe("operator")
    expect(map.get("bob")?.role).toBe("viewer")
  })

  test("parseAdminAccounts ignores bad entries", () => {
    const map = parseAdminAccounts({
      ADMIN_PASSWORD_SHA256: "",
      ADMIN_ACCOUNTS: "bad:short,ok:" + "b".repeat(64) + ":owner"
    })
    expect(map.has("bad")).toBe(false)
    expect(map.get("ok")?.role).toBe("owner")
  })
})

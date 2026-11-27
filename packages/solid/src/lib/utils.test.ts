import { describe, expect, test } from "bun:test"
import { pathWithSearch, shortAddr } from "./utils"
import { SECURITY_HEADERS } from "./securityHeaders"

describe("utils", () => {
  test("shortAddr", () => {
    expect(shortAddr("0x1234567890abcdef")).toBe("0x1234..cdef")
    expect(shortAddr(null)).toBe("")
    expect(shortAddr("0xab")).toBe("0xab")
  })

  test("pathWithSearch", () => {
    expect(pathWithSearch("/trade", "")).toBe("/trade")
    expect(pathWithSearch("/trade", "?ref=1")).toBe("/trade?ref=1")
    expect(pathWithSearch("/trade", "ref=1")).toBe("/trade?ref=1")
  })
})

describe("securityHeaders", () => {
  test("baseline keys present", () => {
    expect(SECURITY_HEADERS["Content-Security-Policy"]).toContain("default-src")
    expect(SECURITY_HEADERS["X-Frame-Options"]).toBe("DENY")
    expect(SECURITY_HEADERS["X-Content-Type-Options"]).toBe("nosniff")
  })
})

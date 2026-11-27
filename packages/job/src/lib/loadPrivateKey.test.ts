import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { loadPrivateKey } from "./loadPrivateKey"

const KEYS = [
  "PRIVATE_KEY",
  "PRIVATE_KEY_FILE",
  "NODE_ENV",
  "ALLOW_PLAINTEXT_PRIVATE_KEY"
] as const

function clearKeys() {
  for (const k of KEYS) {
    Reflect.deleteProperty(process.env, k)
  }
}

beforeEach(clearKeys)
afterEach(clearKeys)

const SAMPLE =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

describe("loadPrivateKey", () => {
  test("reads PRIVATE_KEY_FILE", async () => {
    process.env.NODE_ENV = "production"
    const dir = mkdtempSync(join(tmpdir(), "pk-"))
    const file = join(dir, "key")
    writeFileSync(file, `${SAMPLE}\n`, { mode: 0o600 })
    process.env.PRIVATE_KEY_FILE = file
    await expect(loadPrivateKey()).resolves.toBe(SAMPLE)
  })

  test("allows plaintext PRIVATE_KEY in non-prod", async () => {
    process.env.NODE_ENV = "development"
    process.env.PRIVATE_KEY = SAMPLE
    await expect(loadPrivateKey()).resolves.toBe(SAMPLE)
  })

  test("refuses plaintext PRIVATE_KEY in production", async () => {
    process.env.NODE_ENV = "production"
    process.env.PRIVATE_KEY = SAMPLE
    await expect(loadPrivateKey()).rejects.toThrow(/Refusing plaintext/)
  })

  test("ALLOW_PLAINTEXT_PRIVATE_KEY=1 opts in for prod", async () => {
    process.env.NODE_ENV = "production"
    process.env.ALLOW_PLAINTEXT_PRIVATE_KEY = "1"
    process.env.PRIVATE_KEY = SAMPLE
    await expect(loadPrivateKey()).resolves.toBe(SAMPLE)
  })
})

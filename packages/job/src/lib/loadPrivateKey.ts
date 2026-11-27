/**
 * Resolve keeper signing key without requiring plaintext env in production.
 *
 * Priority:
 * 1. PRIVATE_KEY_FILE — file contents (trim), mode ideally 0600
 * 2. PRIVATE_KEY — raw hex; refused in production unless ALLOW_PLAINTEXT_PRIVATE_KEY=1
 */
import { accessSync, constants } from "node:fs"

function isProduction(): boolean {
  return (process.env.NODE_ENV || "").toLowerCase() === "production"
}

function normalizePk(raw: string): `0x${string}` {
  const v = raw.trim()
  if (!/^0x[0-9a-fA-F]{64}$/.test(v)) {
    throw new Error(
      "Private key must be 0x-prefixed 32-byte hex (66 chars including 0x)"
    )
  }
  return v as `0x${string}`
}

export async function loadPrivateKey(): Promise<`0x${string}`> {
  const fileRaw = process.env.PRIVATE_KEY_FILE?.trim()
  // Bun may coerce assign-undefined to the literal string "undefined"
  const file =
    fileRaw && fileRaw !== "undefined" && fileRaw !== "null" ? fileRaw : ""
  if (file) {
    try {
      accessSync(file, constants.R_OK)
    } catch {
      throw new Error(`PRIVATE_KEY_FILE not readable: ${file}`)
    }
    const text = (await Bun.file(file).text()).trim()
    if (!text) throw new Error(`PRIVATE_KEY_FILE is empty: ${file}`)
    return normalizePk(text.split(/\r?\n/)[0]!)
  }

  const fromEnv = process.env.PRIVATE_KEY?.trim()
  if (fromEnv) {
    if (isProduction() && process.env.ALLOW_PLAINTEXT_PRIVATE_KEY !== "1") {
      throw new Error(
        "Refusing plaintext PRIVATE_KEY in production. Use PRIVATE_KEY_FILE, or set ALLOW_PLAINTEXT_PRIVATE_KEY=1 explicitly."
      )
    }
    return normalizePk(fromEnv)
  }

  throw new Error(
    "No signing key: set PRIVATE_KEY_FILE (preferred) or PRIVATE_KEY"
  )
}

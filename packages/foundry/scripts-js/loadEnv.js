#!/usr/bin/env bun
/**
 * Tiny .env loader — avoids the `dotenv` package (Bun already injects .env when
 * cwd matches; this covers scripts that need packages/foundry/.env explicitly).
 */
import { existsSync, readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const foundryRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

/**
 * @param {string} [filePath]
 */
export function loadFoundryEnv(filePath = join(foundryRoot, ".env")) {
  if (!existsSync(filePath)) return
  const text = readFileSync(filePath, "utf8")
  for (const raw of text.split("\n")) {
    const line = raw.trim()
    if (!line || line.startsWith("#")) continue
    const eq = line.indexOf("=")
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = val
  }
}

#!/usr/bin/env bun
/**
 * Shared Foundry keystore helpers.
 *
 * Security rules:
 * - Never put raw private keys on argv / in shell strings (visible via `ps`).
 * - Prefer `cast wallet new <dir> <name>` (writes encrypted JSON; PK never printed).
 * - Prefer `cast wallet import <name> --interactive` for existing keys.
 * - Never pass `--unsafe-password` for real accounts (localhost anvil only).
 * - Never `spawn(..., { shell: true })` with user-controlled names.
 */
import { spawn, spawnSync } from "child_process"
import { existsSync, mkdirSync, readdirSync } from "fs"
import { homedir } from "os"
import { join } from "path"
import readline from "readline"

/** Local-only Anvil account created by `make chain` — not for mainnet. */
export const LOCAL_ANVIL_ACCOUNT = "scaffold-eth-default"

const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/

export function keystoresDir() {
  return (
    process.env.FOUNDRY_KEYSTORE_DIR ||
    join(homedir(), ".foundry", "keystores")
  )
}

export function keystorePath(name) {
  return join(keystoresDir(), name)
}

export function ensureKeystoresDir() {
  const dir = keystoresDir()
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

/**
 * @param {string} name
 * @param {{ allowReserved?: boolean }} [opts]
 */
export function assertValidKeystoreName(name, opts = {}) {
  const trimmed = (name ?? "").trim()
  if (!trimmed) {
    throw new Error("Keystore name is required")
  }
  if (!NAME_RE.test(trimmed)) {
    throw new Error(
      `Invalid keystore name '${trimmed}'. Use 1–64 chars: letters, digits, . _ - (must start alphanumeric).`
    )
  }
  if (trimmed.includes("..") || trimmed.includes("/") || trimmed.includes("\\")) {
    throw new Error("Keystore name must not contain path separators")
  }
  if (!opts.allowReserved && trimmed === LOCAL_ANVIL_ACCOUNT) {
    throw new Error(
      `'${LOCAL_ANVIL_ACCOUNT}' is reserved for local Anvil (make chain). Choose another name.`
    )
  }
  return trimmed
}

export function keystoreExists(name) {
  return existsSync(keystorePath(name))
}

/**
 * @param {{ includeReserved?: boolean }} [opts]
 * @returns {string[]}
 */
export function listKeystoreNames(opts = {}) {
  const dir = keystoresDir()
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter((name) => {
    if (!opts.includeReserved && name === LOCAL_ANVIL_ACCOUNT) return false
    // skip directories / junk
    try {
      return NAME_RE.test(name)
    } catch {
      return false
    }
  })
}

export function requireCast() {
  const r = spawnSync("cast", ["--version"], { encoding: "utf-8" })
  if (r.error || r.status !== 0) {
    throw new Error(
      "Foundry `cast` not found on PATH. Install: https://book.getfoundry.sh/getting-started/installation"
    )
  }
}

export function requireTty(action = "this operation") {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(
      `Refusing ${action}: need an interactive TTY (password / private key prompts).`
    )
  }
}

/**
 * Run cast with argv array only (never shell).
 * @param {string[]} args
 * @param {{ inherit?: boolean, input?: string, env?: NodeJS.ProcessEnv }} [opts]
 */
export function runCast(args, opts = {}) {
  requireCast()
  if (opts.inherit) {
    return new Promise((resolve, reject) => {
      const child = spawn("cast", args, {
        stdio: "inherit",
        env: { ...process.env, ...opts.env },
        shell: false
      })
      child.on("error", reject)
      child.on("close", (code) => {
        if (code === 0) resolve({ status: 0 })
        else reject(new Error(`cast ${args[0]} ${args[1] ?? ""} failed (exit ${code})`))
      })
    })
  }
  const r = spawnSync("cast", args, {
    encoding: "utf-8",
    input: opts.input,
    env: { ...process.env, ...opts.env },
    shell: false
  })
  if (r.error) throw r.error
  if (r.status !== 0) {
    const err = (r.stderr || r.stdout || "").trim() || `exit ${r.status}`
    throw new Error(err)
  }
  return r
}

/**
 * Create encrypted keystore without ever exposing the private key on argv or stdout.
 * Uses: `cast wallet new <keystoresDir> <name>`
 * @param {string} name
 */
export async function createEncryptedKeystore(name) {
  const account = assertValidKeystoreName(name)
  requireTty("keystore creation")
  ensureKeystoresDir()
  if (keystoreExists(account)) {
    throw new Error(`Keystore '${account}' already exists at ${keystorePath(account)}`)
  }
  // Password prompt is interactive; PK is written into the JSON keystore only.
  await runCast(["wallet", "new", keystoresDir(), account], { inherit: true })
  if (!keystoreExists(account)) {
    throw new Error(`cast finished but keystore file missing: ${keystorePath(account)}`)
  }
  return account
}

/**
 * Import an existing private key via interactive prompt (not argv).
 * @param {string} name
 */
export async function importKeystoreInteractive(name) {
  const account = assertValidKeystoreName(name)
  requireTty("keystore import")
  ensureKeystoresDir()
  if (keystoreExists(account)) {
    throw new Error(`Keystore '${account}' already exists at ${keystorePath(account)}`)
  }
  const args = ["wallet", "import", account, "--interactive"]
  if (process.env.FOUNDRY_KEYSTORE_DIR) {
    args.push("--keystore-dir", keystoresDir())
  }
  await runCast(args, { inherit: true })
  return account
}

/**
 * Decrypt keystore → private key string (caller must gate with --yes-print).
 * @param {string} name
 */
export function decryptKeystore(name) {
  const account = assertValidKeystoreName(name, { allowReserved: true })
  requireTty("keystore decrypt")
  if (!keystoreExists(account) && account !== LOCAL_ANVIL_ACCOUNT) {
    throw new Error(`Keystore '${account}' not found in ${keystoresDir()}`)
  }
  const args = ["wallet", "decrypt-keystore", account]
  if (process.env.FOUNDRY_KEYSTORE_DIR) {
    args.push("--keystore-dir", keystoresDir())
  }
  const r = runCast(args, { inherit: false })
  // cast prints "Private key: 0x…" or just the key depending on version
  const out = (r.stdout || "").trim()
  const match = out.match(/(?:Private key:\s*)?(0x[0-9a-fA-F]{64})/)
  return match ? match[1] : out
}

/**
 * Address for a keystore account (password may be prompted).
 * @param {string} name
 */
export function addressOfAccount(name) {
  const account = assertValidKeystoreName(name, { allowReserved: true })
  const r = runCast(["wallet", "address", "--account", account])
  const line = (r.stdout || "").trim().split("\n").pop()
  return line.trim()
}

export function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

export function printKeystoreSecurityTips() {
  console.log(`
Security notes:
  • Keystores live in ${keystoresDir()} (override with FOUNDRY_KEYSTORE_DIR).
  • Private keys are never passed on argv by these scripts.
  • Do not commit .env, keystore JSON, or broadcast/ artifacts with secrets.
  • Production deployers: prefer hardware wallets / KMS; keystore is for ops convenience.
  • Never use ${LOCAL_ANVIL_ACCOUNT} / Anvil default keys on a live network.
`)
}

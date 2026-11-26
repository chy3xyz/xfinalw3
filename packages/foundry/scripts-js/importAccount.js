#!/usr/bin/env bun
/**
 * Import an existing private key into an encrypted Foundry keystore.
 * Uses `cast wallet import <name> --interactive` (PK entered at hidden prompt, not argv).
 */
import {
  assertValidKeystoreName,
  importKeystoreInteractive,
  keystoreExists,
  keystoresDir,
  printKeystoreSecurityTips,
  ask
} from "./keystoreUtils.js"

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(`
Usage: bun run account:import [keystore-name]

Imports a private key via interactive prompt into ${keystoresDir()}.
Does not accept --private-key on the command line (avoids ps(1) leakage).

Options:
  --help, -h    Show this help

Env:
  FOUNDRY_KEYSTORE_DIR   Override keystore directory
`)
    printKeystoreSecurityTips()
    process.exit(0)
  }

  try {
    let accountName = process.argv.slice(2).find((a) => !a.startsWith("-"))
    if (!accountName) {
      accountName = (await ask("\nEnter account name (e.g., my-keystore): ")).trim()
    }

    accountName = assertValidKeystoreName(accountName)

    if (keystoreExists(accountName)) {
      console.error(`\n❌ Keystore '${accountName}' already exists`)
      process.exit(1)
    }

    console.log(`\n📥 Importing into '${accountName}' (interactive private-key + password prompts)…\n`)
    await importKeystoreInteractive(accountName)
    console.log(`\n✅ Account '${accountName}' imported.`)
    printKeystoreSecurityTips()
  } catch (error) {
    console.error("\n❌", error?.message || error)
    process.exit(1)
  }
}

main()

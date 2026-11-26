#!/usr/bin/env bun
/**
 * Generate a new encrypted Foundry keystore.
 *
 * Uses `cast wallet new <dir> <name>` so the private key is never printed
 * and never placed on process argv (unlike `cast wallet new` + import --private-key).
 */
import {
  assertValidKeystoreName,
  createEncryptedKeystore,
  keystoreExists,
  keystoresDir,
  listKeystoreNames,
  printKeystoreSecurityTips,
  ask
} from "./keystoreUtils.js"

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(`
Usage: bun run account:generate [keystore-name]

Creates an encrypted keystore under ${keystoresDir()} via Foundry cast.
The private key is written only into the keystore file (never on argv / stdout).

Options:
  --help, -h    Show this help

Env:
  FOUNDRY_KEYSTORE_DIR   Override keystore directory
`)
    printKeystoreSecurityTips()
    process.exit(0)
  }

  try {
    let name = process.argv.slice(2).find((a) => !a.startsWith("-"))
    if (!name) {
      const existing = listKeystoreNames({ includeReserved: true })
      if (existing.length) {
        console.log("\n💼 Existing keystores:", existing.join(", "))
      }
      name = (await ask("\nEnter name for new keystore: ")).trim()
    }

    name = assertValidKeystoreName(name)
    if (keystoreExists(name)) {
      console.error(`❌ Keystore '${name}' already exists`)
      process.exit(1)
    }

    console.log(`\n🔐 Creating encrypted keystore '${name}' in ${keystoresDir()}…`)
    console.log("   (cast will prompt for a password; private key stays inside the file)\n")

    await createEncryptedKeystore(name)

    console.log(`\n✅ Keystore '${name}' created.`)
    console.log(`\nTIP: Fund the address, then \`bun account\` / deploy with this keystore.`)
    printKeystoreSecurityTips()
  } catch (error) {
    console.error("\n❌", error?.message || error)
    process.exit(1)
  }
}

main()

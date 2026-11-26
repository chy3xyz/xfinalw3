#!/usr/bin/env bun
/**
 * Show the address for a keystore without revealing the private key.
 */
import { listKeystores } from "./listKeystores.js"
import {
  addressOfAccount,
  assertValidKeystoreName,
  keystoreExists,
  keystoresDir,
  LOCAL_ANVIL_ACCOUNT
} from "./keystoreUtils.js"

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(`
Usage: bun run account:address [keystore-name]

Prints the account address (may prompt for keystore password).
Does not print the private key.
`)
    process.exit(0)
  }

  try {
    let name = process.argv.slice(2).find((a) => !a.startsWith("-"))
    if (!name) {
      name = await listKeystores(
        "Select a keystore to show its address (enter the number, e.g., 1): "
      )
    }
    name = assertValidKeystoreName(name, { allowReserved: true })
    if (!keystoreExists(name) && name !== LOCAL_ANVIL_ACCOUNT) {
      console.error(`❌ Keystore '${name}' not found in ${keystoresDir()}`)
      process.exit(1)
    }
    const address = addressOfAccount(name)
    console.log(`\n📍 ${name}: ${address}\n`)
  } catch (error) {
    console.error("\n❌", error?.message || error)
    process.exit(1)
  }
}

main()

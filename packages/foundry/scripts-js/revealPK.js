#!/usr/bin/env bun
/**
 * Decrypt and print a keystore private key.
 * Requires --yes-print. Never uses a shell string for the account name.
 */
import { listKeystores } from "./listKeystores.js"
import {
  assertValidKeystoreName,
  decryptKeystore,
  keystoreExists,
  keystoresDir,
  LOCAL_ANVIL_ACCOUNT,
  printKeystoreSecurityTips,
  requireTty
} from "./keystoreUtils.js"

async function revealPk() {
  const args = process.argv.slice(2).filter((a) => a !== "--yes-print")
  const yesPrint = process.argv.includes("--yes-print")

  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(`
Usage: bun run account:reveal-pk --yes-print [keystore-name]

Options:
  --yes-print      Required. Acknowledge printing the private key to stdout.
  keystore-name    Optional (selection menu if omitted)
  --help, -h       Show this help

Examples:
  bun run account:reveal-pk --yes-print my-account1
  bun run account:reveal-pk --yes-print
`)
    printKeystoreSecurityTips()
    process.exit(0)
  }

  if (!yesPrint) {
    console.error(
      "\n❌ Refusing to print a private key without --yes-print (dangerous)."
    )
    console.error(
      "Usage: bun run account:reveal-pk --yes-print [keystore-name]\n"
    )
    process.exit(1)
  }

  try {
    requireTty("revealing a private key")

    let selectedKeystore = args.find((a) => !a.startsWith("-"))

    if (selectedKeystore) {
      selectedKeystore = assertValidKeystoreName(selectedKeystore, {
        allowReserved: true
      })
      if (
        !keystoreExists(selectedKeystore) &&
        selectedKeystore !== LOCAL_ANVIL_ACCOUNT
      ) {
        console.error(`\n❌ Keystore '${selectedKeystore}' not found in ${keystoresDir()}`)
        process.exit(1)
      }
      console.log(`\n👀 Revealing private key for keystore: ${selectedKeystore}`)
    } else {
      console.log("👀 This will reveal your private key on the console.")
      selectedKeystore = await listKeystores(
        "Select a keystore to reveal its private key (enter the number, e.g., 1): "
      )
      if (!selectedKeystore) {
        console.error("❌ No keystore selected")
        process.exit(1)
      }
    }

    if (selectedKeystore === LOCAL_ANVIL_ACCOUNT) {
      console.warn(
        `\n⚠️  '${LOCAL_ANVIL_ACCOUNT}' is the public Anvil account — never use it on a live network.`
      )
    }

    const pk = decryptKeystore(selectedKeystore)
    console.log(`\n🔑 Private Key: ${pk}`)
    console.log(
      `\n⚠️  WARNING: Clear your terminal scrollback / clipboard after use. Never paste into chat or commits.`
    )
  } catch (error) {
    console.error("\n❌ Failed to decrypt keystore.")
    console.error(error?.message || error)
    console.error("Possible reasons: wrong password, missing file, corrupted keystore.")
    process.exit(1)
  }
}

revealPk().catch((error) => {
  console.error("\n❌ Unexpected error:", error)
  process.exit(1)
})

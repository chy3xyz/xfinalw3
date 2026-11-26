#!/usr/bin/env bun
import readline from "readline"
import { fileURLToPath } from "url"
import {
  assertValidKeystoreName,
  createEncryptedKeystore,
  keystoresDir,
  listKeystoreNames
} from "./keystoreUtils.js"

async function selectOrCreateKeystore() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  try {
    const keystores = listKeystoreNames()

    if (keystores.length === 0) {
      console.log(
        `\n❌ No keystores in ${keystoresDir()} — select 0 to create a new one.`
      )
    }

    console.log("\n🔑 Available keystores:")
    console.log("0. Create new keystore")
    keystores.forEach((keystore, index) => {
      console.log(`${index + 1}. ${keystore}`)
    })

    const answer = await new Promise((resolve) => {
      rl.question(
        "\nSelect a keystore or create new (enter number): ",
        resolve
      )
    })

    const selection = parseInt(answer, 10)

    if (selection === 0) {
      const rawName = await new Promise((resolve) => {
        rl.question("\nEnter name for new keystore: ", resolve)
      })
      rl.close()

      const keystoreName = assertValidKeystoreName(rawName)
      console.log(
        `\n🔐 Creating encrypted keystore (private key never on argv)…\n`
      )
      await createEncryptedKeystore(keystoreName)
      console.log(
        "\n💰 Fund the address and re-run the deploy command to use this keystore."
      )
      console.log(
        `\nTIP: Use \`bun account\` and select \`${keystoreName}\` to check balances.`
      )
      process.exit(0)
    }

    if (isNaN(selection) || selection < 1 || selection > keystores.length) {
      console.error("\n❌ Invalid selection")
      process.exit(1)
    }

    return keystores[selection - 1]
  } catch (error) {
    console.error("\n❌ Error:", error?.message || error)
    process.exit(1)
  } finally {
    try {
      rl.close()
    } catch {
      /* already closed */
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  selectOrCreateKeystore()
    .then((keystore) => {
      if (keystore) console.log("\n🔑 Selected keystore:", keystore)
    })
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { selectOrCreateKeystore }

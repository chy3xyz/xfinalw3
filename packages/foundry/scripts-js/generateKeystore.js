#!/usr/bin/env bun
/**
 * Generate a new Foundry keystore via `cast wallet new` + `cast wallet import`.
 * Replaces the previous mistaken copy of generateTsAbis.js.
 */
import { spawn, spawnSync } from "child_process"
import { existsSync, readdirSync } from "fs"
import { join } from "path"
import readline from "readline"

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, resolve)
  })
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(`
Usage: bun run account:generate

Creates a new encrypted keystore under ~/.foundry/keystores using Foundry cast.
`)
    process.exit(0)
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  try {
    const keystorePath = join(process.env.HOME, ".foundry", "keystores")
    const existing = existsSync(keystorePath) ? readdirSync(keystorePath) : []

    console.log("\n🔐 Generating a new wallet with `cast wallet new`…")
    const newWalletResult = spawnSync("cast", ["wallet", "new"], {
      encoding: "utf-8"
    })

    if (newWalletResult.error || newWalletResult.status !== 0) {
      console.error(
        "\n❌ Error generating wallet:",
        newWalletResult.stderr || newWalletResult.error
      )
      process.exit(1)
    }

    const privateKey = newWalletResult.stdout
      .split("\n")
      .find((line) => line.includes("Private key:"))
      ?.split(":")[1]
      ?.trim()

    const address = newWalletResult.stdout
      .split("\n")
      .find((line) => line.toLowerCase().includes("address:"))
      ?.split(":")[1]
      ?.trim()

    if (!privateKey) {
      console.error("\n❌ Could not extract private key from cast output")
      process.exit(1)
    }

    if (address) {
      console.log(`\n📍 Address: ${address}`)
    }

    let keystoreName = (await ask(rl, "\nEnter name for new keystore: ")).trim()
    if (!keystoreName) {
      console.error("❌ Keystore name is required")
      process.exit(1)
    }
    if (existing.includes(keystoreName)) {
      console.error(`❌ Keystore '${keystoreName}' already exists`)
      process.exit(1)
    }

    rl.close()

    await new Promise((resolve, reject) => {
      // cast prompts for password interactively (not passed on argv)
      const importProcess = spawn(
        "cast",
        ["wallet", "import", keystoreName, "--private-key", privateKey],
        { stdio: "inherit" }
      )
      importProcess.on("close", (code) => {
        if (code === 0) {
          console.log(`\n✅ Keystore '${keystoreName}' created.`)
          console.log(
            `\nTIP: Fund the address, then \`bun account\` / deploy with this keystore.`
          )
          console.log(
            `\n⚠️  Private key briefly existed in this process memory and cast argv — prefer hardware wallets for production.`
          )
          resolve()
        } else {
          reject(new Error("cast wallet import failed"))
        }
      })
    })
  } catch (error) {
    console.error("\n❌", error?.message || error)
    process.exit(1)
  }
}

main()

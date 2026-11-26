#!/usr/bin/env bun
import readline from "readline"
import { fileURLToPath } from "url"
import {
  keystoresDir,
  listKeystoreNames,
  printKeystoreSecurityTips
} from "./keystoreUtils.js"

async function listKeystores(
  selectMessage = "Select a keystore (enter the number, e.g., 1):"
) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  try {
    const keystores = listKeystoreNames()

    if (keystores.length === 0) {
      console.error(
        `\n❌ No keystores found in ${keystoresDir()}, create one with:`
      )
      console.log("\n\tbun account:generate\n")
      process.exit(1)
    }

    console.log("\n💼 Available keystores:")
    keystores.forEach((keystore, index) => {
      console.log(`${index + 1}. ${keystore}`)
    })

    const answer = await new Promise((resolve) => {
      rl.question(`\n${selectMessage}`, resolve)
    })

    const selection = parseInt(answer, 10)
    if (isNaN(selection) || selection < 1 || selection > keystores.length) {
      console.error("\n❌ Invalid selection")
      process.exit(1)
    }

    return keystores[selection - 1]
  } finally {
    rl.close()
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(`
Usage: bun run account:list

Lists encrypted keystores in ${keystoresDir()} (excludes scaffold-eth-default).
`)
    printKeystoreSecurityTips()
    process.exit(0)
  }

  const names = listKeystoreNames()
  if (names.length === 0) {
    console.log(`\n(no keystores in ${keystoresDir()})`)
    console.log("Create one: bun account:generate\n")
    process.exit(0)
  }
  console.log(`\n💼 Keystores in ${keystoresDir()}:`)
  names.forEach((n, i) => console.log(`${i + 1}. ${n}`))
  console.log("")
}

export { listKeystores }

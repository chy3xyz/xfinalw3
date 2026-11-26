#!/usr/bin/env bun
/**
 * Show address + balances across foundry.toml rpc_endpoints.
 * Uses workspace-shared `viem` (no ethers) to keep root node_modules lean.
 */
import { listKeystores } from "./listKeystores.js"
import { addressOfAccount } from "./keystoreUtils.js"
import { loadFoundryEnv } from "./loadEnv.js"
import { createPublicClient, formatEther, http } from "viem"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { readFileSync } from "fs"
import { parse } from "toml"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
loadFoundryEnv()

async function getBalanceForEachNetwork(address) {
  try {
    const foundryTomlPath = join(__dirname, "..", "foundry.toml")
    const parsedToml = parse(readFileSync(foundryTomlPath, "utf-8"))
    const rpcEndpoints = parsedToml.rpc_endpoints || {}
    const alchemyKey = process.env.ALCHEMY_API_KEY || ""

    console.log(`\n📊 Address: ${address}`)

    for (const networkName in rpcEndpoints) {
      const networkUrl = String(rpcEndpoints[networkName]).replace(
        "${ALCHEMY_API_KEY}",
        alchemyKey
      )
      console.log(`\n--${networkName}-- 📡`)

      try {
        const client = createPublicClient({ transport: http(networkUrl) })
        const [balance, nonce] = await Promise.all([
          client.getBalance({ address }),
          client.getTransactionCount({ address })
        ])
        console.log("   Balance:", Number(formatEther(balance)))
        console.log("   Nonce:", nonce)
      } catch (e) {
        console.log(
          `   ❌ Can't connect to network ${networkName}: ${e.message}`
        )
      }
    }
  } catch (error) {
    console.error("Error reading foundry.toml:", error)
  }
}

async function checkAccountBalance() {
  try {
    console.log("📋 Listing available accounts...")
    const selectedKeystore = await listKeystores(
      "Select a keystore to display its balance (enter the number, e.g., 1): "
    )

    if (!selectedKeystore) {
      console.error("❌ No keystore selected")
      process.exit(1)
    }

    console.log(`\n🔍 Getting address for keystore: ${selectedKeystore}`)
    try {
      const address = addressOfAccount(selectedKeystore)
      console.log("\n💰 Checking balances across networks...\n")
      await getBalanceForEachNetwork(address)
    } catch (error) {
      console.error(`❌ Error getting address: ${error.message}`)
      process.exit(1)
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`)
    process.exit(1)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  checkAccountBalance().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}

export { checkAccountBalance }

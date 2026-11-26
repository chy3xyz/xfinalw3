#!/usr/bin/env bun

/**
 * Local deployment script for frontend testing
 *
 * Features:
 * 1. Start local chain (if not running)
 * 2. Deploy all contracts
 * 3. Generate contract address configuration for frontend
 * 4. Output deployment information
 *
 * Usage:
 * bun run deploy:local
 * or
 * bun packages/foundry/scripts-js/deployLocal.js
 */

import { execSync, spawnSync } from "child_process"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { ensureKeystoresDir, keystoreExists } from "./keystoreUtils.js"

/** Public Anvil account #0 — localhost only. Never use on a live network. */
const ANVIL0_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
const LOCAL_DEPLOY_ACCOUNT = "scaffold-eth-anvil0"

/**
 * One-time import of the public Anvil #0 key into an encrypted keystore so
 * subsequent forge deploys use --account (not --private-key on argv).
 * Residual: the well-known Anvil PK appears on argv only during this setup.
 */
function ensureLocalDeployKeystore() {
  ensureKeystoresDir()
  if (keystoreExists(LOCAL_DEPLOY_ACCOUNT)) return
  const r = spawnSync(
    "cast",
    [
      "wallet",
      "import",
      LOCAL_DEPLOY_ACCOUNT,
      "--private-key",
      ANVIL0_PRIVATE_KEY,
      "--unsafe-password",
      "localhost"
    ],
    { stdio: "inherit", shell: false }
  )
  if (r.status !== 0) {
    throw new Error(
      `failed to create local keystore '${LOCAL_DEPLOY_ACCOUNT}' (exit ${r.status})`
    )
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FOUNDRY_DIR = path.resolve(__dirname, "..");
const ROOT_DIR = path.resolve(FOUNDRY_DIR, "../..");
const DEPLOYMENTS_DIR = path.join(FOUNDRY_DIR, "deployments");

// Check if local chain is running
function checkLocalChain() {
  try {
    execSync("curl -s http://localhost:8545 > /dev/null", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// Start local chain
function startLocalChain() {
  console.log("🚀 Starting local chain...");
  try {
    // Check if anvil is already running
    try {
      execSync('pgrep -f "anvil"', { stdio: "ignore" });
      console.log("✅ Local chain already running");
      return;
    } catch {
      // Not running, start new process
    }

    // Start anvil in background
    execSync("anvil --host 0.0.0.0 --port 8545 > /dev/null 2>&1 &", {
      cwd: FOUNDRY_DIR,
    });
    console.log("✅ Local chain started");

    // Wait for chain to be ready
    let retries = 10;
    while (retries > 0) {
      if (checkLocalChain()) {
        console.log("✅ Local chain is ready");
        return;
      }
      retries--;
      execSync("sleep 1", { stdio: "ignore" });
    }
    throw new Error("Failed to start local chain");
  } catch (error) {
    console.error("❌ Failed to start local chain:", error.message);
    process.exit(1);
  }
}

// Deploy contracts
function deployContracts() {
  console.log("\n📦 Deploying contracts...");
  try {
    // Ensure contracts are compiled
    console.log("🔨 Compiling contracts...");
    execSync("forge build", {
      cwd: FOUNDRY_DIR,
      stdio: "inherit",
    });

    // Prefer encrypted keystore over --private-key on argv (ps leakage).
    // The Anvil #0 key is public; we still keep it out of the forge argv when possible.
    ensureLocalDeployKeystore()
    const result = spawnSync(
      "forge",
      [
        "script",
        "script/DeployLocal.s.sol:DeployLocalScript",
        "--rpc-url",
        "http://localhost:8545",
        "--broadcast",
        "--skip-simulation",
        "--slow",
        "--account",
        LOCAL_DEPLOY_ACCOUNT,
        "--password",
        "localhost"
      ],
      {
        cwd: FOUNDRY_DIR,
        stdio: "inherit",
        shell: false
      }
    )
    if (result.status !== 0) {
      throw new Error(`forge script failed (exit ${result.status})`)
    }
    console.log("✅ Contracts deployed successfully")
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    process.exit(1);
  }
}

// Read deployment results
function readDeployments() {
  const deploymentFile = path.join(DEPLOYMENTS_DIR, "31337.json");

  if (!fs.existsSync(deploymentFile)) {
    throw new Error("Deployment file not found. Run deploy first.");
  }

  const raw = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const byName = {};
  for (const [addr, name] of Object.entries(raw)) {
    if (name && typeof name === "string" && name !== "networkName") {
      byName[name] = addr;
    }
  }
  return byName;
}

// Generate contract ABIs
function generateAbis() {
  console.log("\n📝 Generating contract ABIs...");
  try {
    const generateAbisScript = path.join(__dirname, "generateTsAbis.js");
    execSync(`bun ${generateAbisScript}`, {
      cwd: FOUNDRY_DIR,
      stdio: "inherit",
    });
    console.log("✅ Contract ABIs generated successfully");
  } catch (error) {
    console.error("❌ Failed to generate ABIs:", error.message);
    // Don't exit, address config is already generated
  }
}

// Main function
function main() {
  console.log("🎯 xfinalw3 Local Deployment Script\n");

  // 1. Check and start local chain
  if (!checkLocalChain()) {
    startLocalChain();
  } else {
    console.log("✅ Local chain is running");
  }

  // 2. Deploy contracts
  deployContracts();

  // 3. Read deployment results
  const deployments = readDeployments();
  console.log("\n📋 Deployed contracts:");
  for (const [name, addr] of Object.entries(deployments)) {
    console.log(`   ${name}: ${addr}`);
  }

  // 4. Generate contract ABIs
  generateAbis();

  console.log("\n✨ Deployment complete!");
  console.log("\n📋 Next steps:");
  console.log(
    "  1. Check packages/foundry/deployments/31337.json for contract addresses"
  );
  console.log(
    "  2. Use deployedContracts.ts (with ABIs) in your frontend code"
  );
  console.log("  3. Connect your wallet to local network (Chain ID: 31337)");
  console.log("  4. Start testing! 🚀\n");
}

// Run main function
main();

export { main, checkLocalChain, startLocalChain, deployContracts };

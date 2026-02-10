#!/usr/bin/env node

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
 * node packages/foundry/scripts-js/deployLocal.js
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

    // Use Anvil's default account private key (first account)
    // Anvil default account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
    // Private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
    const privateKey =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    execSync(
      `forge script script/DeployLocal.s.sol:DeployLocalScript --rpc-url http://localhost:8545 --broadcast --skip-simulation --slow --private-key ${privateKey}`,
      {
        cwd: FOUNDRY_DIR,
        stdio: "inherit",
      }
    );
    console.log("✅ Contracts deployed successfully");
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
    execSync(`node ${generateAbisScript}`, {
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

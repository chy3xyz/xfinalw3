import { listKeystores } from "./listKeystores.js";
import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

async function revealPk() {
  try {
    // Check if keystore name is provided as command line argument
    let selectedKeystore = process.argv[2];

    if (selectedKeystore) {
      // Validate keystore exists
      const keystorePath = join(
        process.env.HOME,
        ".foundry",
        "keystores",
        selectedKeystore
      );

      if (
        !existsSync(keystorePath) &&
        selectedKeystore !== "scaffold-eth-default"
      ) {
        console.error(`\n❌ Error: Keystore '${selectedKeystore}' not found!`);
        console.error(
          `Please check that the keystore exists in ~/.foundry/keystores/`
        );
        process.exit(1);
      }

      console.log(
        `\n👀 Revealing private key for keystore: ${selectedKeystore}`
      );
    } else {
      // Interactive mode: select from list
      console.log("👀 This will reveal your private key on the console.");
      selectedKeystore = await listKeystores(
        "Select a keystore to reveal its private key (enter the number, e.g., 1): "
      );

      if (!selectedKeystore) {
        console.error("❌ No keystore selected");
        process.exit(1);
      }
    }

    try {
      const revealPKCommand = `cast wallet decrypt-keystore ${selectedKeystore}`;

      const revealPKResult = execSync(revealPKCommand, {
        encoding: "utf-8",
        stdio: ["inherit", "pipe", "pipe"],
      })
        .toString()
        .trim();

      console.log(`\n🔑 Private Key: ${revealPKResult}`);
      console.log(
        `\n⚠️  WARNING: Keep this private key secure and never share it!`
      );
    } catch (error) {
      console.error("\n❌ Failed to decrypt keystore.");
      console.error("Possible reasons:");
      console.error("  1. Wrong password");
      console.error("  2. Keystore file is corrupted");
      console.error("  3. Keystore does not exist");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Error revealing private key:");
    console.error(error.message);
    process.exit(1);
  }
}

// Show help if --help is provided
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
Usage: bun run account:reveal-pk [keystore-name]

Options:
  keystore-name    Name of the keystore to reveal (optional, will show selection menu if not provided)
  --help, -h       Show this help message

Examples:
  bun run account:reveal-pk my-account1
  bun run account:reveal-pk
  `);
  process.exit(0);
}

revealPk().catch((error) => {
  console.error("\n❌ Unexpected error:", error);
  process.exit(1);
});

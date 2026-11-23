import { execSync } from "child_process"
import { existsSync } from "fs"
import { join } from "path"
import { listKeystores } from "./listKeystores.js"

async function revealPk() {
  const args = process.argv.slice(2).filter((a) => a !== "--yes-print")
  const yesPrint = process.argv.includes("--yes-print")

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
    let selectedKeystore = args[0]

    if (selectedKeystore) {
      const keystorePath = join(
        process.env.HOME,
        ".foundry",
        "keystores",
        selectedKeystore
      )

      if (
        !existsSync(keystorePath) &&
        selectedKeystore !== "scaffold-eth-default"
      ) {
        console.error(`\n❌ Error: Keystore '${selectedKeystore}' not found!`)
        console.error(
          `Please check that the keystore exists in ~/.foundry/keystores/`
        )
        process.exit(1)
      }

      console.log(
        `\n👀 Revealing private key for keystore: ${selectedKeystore}`
      )
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

    try {
      const revealPKCommand = `cast wallet decrypt-keystore ${selectedKeystore}`

      const revealPKResult = execSync(revealPKCommand, {
        encoding: "utf-8",
        stdio: ["inherit", "pipe", "pipe"]
      })
        .toString()
        .trim()

      console.log(`\n🔑 Private Key: ${revealPKResult}`)
      console.log(
        `\n⚠️  WARNING: Keep this private key secure and never share it!`
      )
    } catch {
      console.error("\n❌ Failed to decrypt keystore.")
      console.error("Possible reasons:")
      console.error("  1. Wrong password")
      console.error("  2. Keystore file is corrupted")
      console.error("  3. Keystore does not exist")
      process.exit(1)
    }
  } catch (error) {
    console.error("\n❌ Error revealing private key:")
    console.error(error.message)
    process.exit(1)
  }
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
Usage: bun run account:reveal-pk --yes-print [keystore-name]

Options:
  --yes-print      Required. Acknowledge printing the private key to stdout.
  keystore-name    Optional keystore name (selection menu if omitted)
  --help, -h       Show this help message

Examples:
  bun run account:reveal-pk --yes-print my-account1
  bun run account:reveal-pk --yes-print
  `)
  process.exit(0)
}

revealPk().catch((error) => {
  console.error("\n❌ Unexpected error:", error)
  process.exit(1)
})

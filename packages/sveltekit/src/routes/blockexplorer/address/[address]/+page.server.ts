import { existsSync, readFileSync, readdirSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { FOUNDRY_BUILD_INFO_DIR } from "$app/env/private"
import deployedContracts from "$lib/contracts/deployedContracts.js"
import type { GenericContractsDeclaration } from "$lib/utils/contractTypes.js"
import type { Address } from "viem"
import { foundry } from "viem/chains"
import type { PageServerLoad } from "./$types"

async function fetchByteCodeAndAssembly(
  buildInfoDirectory: string,
  contractPath: string
) {
  const buildInfoFiles = readdirSync(buildInfoDirectory)
  let bytecode = ""
  let assembly = ""

  for (let i = 0; i < buildInfoFiles.length; i++) {
    const filePath = join(buildInfoDirectory, buildInfoFiles[i])
    const buildInfo = JSON.parse(readFileSync(filePath, "utf8"))

    if (buildInfo.output?.contracts?.[contractPath]) {
      for (const contract in buildInfo.output.contracts[contractPath]) {
        bytecode =
          buildInfo.output.contracts[contractPath][contract].evm.bytecode.object
        assembly =
          buildInfo.output.contracts[contractPath][contract].evm.bytecode
            .opcodes
        break
      }
    }

    if (bytecode && assembly) {
      break
    }
  }

  return { bytecode, assembly }
}

function findBuildInfoDirectory(): string {
  const rel = join("packages", "foundry", "out", "build-info")
  if (FOUNDRY_BUILD_INFO_DIR) return FOUNDRY_BUILD_INFO_DIR
  let dir = dirname(fileURLToPath(import.meta.url))
  for (let i = 0; i < 12; i++) {
    const candidate = join(dir, rel)
    if (existsSync(candidate)) return candidate
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  // fallback (dev / unusual layouts)
  return join(process.cwd(), rel)
}

async function getContractData(
  address: Address
): Promise<{ bytecode: string; assembly: string } | null> {
  const contracts = deployedContracts as GenericContractsDeclaration | null
  const chainId = foundry.id

  if (
    !contracts ||
    !contracts[chainId] ||
    Object.keys(contracts[chainId]).length === 0
  ) {
    return null
  }

  let contractPath = ""

  // Path to foundry build-info directory
  // Resolve from this file (not process.cwd()): packages/sveltekit/src/routes/blockexplorer/address/[address]/ -> monorepo root.
  // Under adapter-bun the bundled file lives in packages/sveltekit/build/server/..., so also try walking up to find packages/foundry.
  const buildInfoDirectory = findBuildInfoDirectory()

  if (!existsSync(buildInfoDirectory)) {
    console.warn(`Directory ${buildInfoDirectory} not found.`)
    return null
  }

  const deployedContractsOnChain = contracts[chainId]
  for (const [contractName, contractInfo] of Object.entries(
    deployedContractsOnChain
  )) {
    if (contractInfo.address.toLowerCase() === address.toLowerCase()) {
      contractPath = `contracts/${contractName}.sol`
      break
    }
  }

  if (!contractPath) {
    return null
  }

  const { bytecode, assembly } = await fetchByteCodeAndAssembly(
    buildInfoDirectory,
    contractPath
  )

  return { bytecode, assembly }
}

export const load: PageServerLoad = async ({ params }) => {
  const address = params.address as Address

  // Fetch contract data on server side only
  const contractData = await getContractData(address)

  return {
    address,
    contractData
  }
}

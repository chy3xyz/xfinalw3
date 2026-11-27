import { createConfig } from "bponder"
import { CounterAbi } from "./abis/Counter"

const rpc = process.env.PONDER_RPC_URL_1
if (!rpc) {
  throw new Error("PONDER_RPC_URL_1 is required")
}

/**
 * Default local Anvil / `bun deploy:local` Counter address (first CREATE).
 * Override with COUNTER_ADDRESS; set empty to disable contract indexing.
 */
const DEFAULT_LOCAL_COUNTER =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3" as const

const chainId = Number(process.env.PONDER_CHAIN_ID || "31337")
const startBlockEnv = process.env.PONDER_START_BLOCK
const startBlock =
  startBlockEnv === undefined || startBlockEnv === ""
    ? chainId === 31337
      ? 0
      : ("latest" as const)
    : startBlockEnv === "latest"
      ? ("latest" as const)
      : Number(startBlockEnv)

const counterRaw = process.env.COUNTER_ADDRESS
const counterAddress =
  counterRaw === ""
    ? undefined
    : ((counterRaw ||
        (chainId === 31337 ? DEFAULT_LOCAL_COUNTER : undefined)) as
        | `0x${string}`
        | undefined)

/**
 * Framework sample: local foundry chain + Counter CountUpdated.
 * Remotes: set PONDER_CHAIN_ID / COUNTER_ADDRESS / PONDER_START_BLOCK.
 * Heartbeat keeps ≥1 indexing function even without a contract address.
 */
export default createConfig({
  chains: {
    app: {
      id: chainId,
      rpc
    }
  },
  blocks: {
    Heartbeat: {
      chain: "app",
      startBlock,
      interval: chainId === 31337 ? 10 : 1_000
    }
  },
  contracts: counterAddress
    ? {
        Counter: {
          abi: CounterAbi,
          chain: "app",
          address: counterAddress,
          startBlock: typeof startBlock === "number" ? startBlock : 0
        }
      }
    : {}
})

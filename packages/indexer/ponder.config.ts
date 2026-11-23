import { createConfig } from "ponder"

const rpc = process.env.PONDER_RPC_URL_1
if (!rpc) {
  throw new Error("PONDER_RPC_URL_1 is required")
}

/**
 * Scaffold indexes a sparse block stream so bponder has ≥1 indexing function.
 * Replace `blocks` / `contracts` with your real sources when ready.
 */
export default createConfig({
  chains: {
    mainnet: {
      id: 1,
      rpc
    }
  },
  blocks: {
    Heartbeat: {
      chain: "mainnet",
      // "latest" keeps scaffold sync cheap; pin a number for reproducible backfills
      startBlock: "latest",
      interval: 1_000
    }
  },
  contracts: {}
})

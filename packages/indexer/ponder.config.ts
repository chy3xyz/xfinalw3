import { createConfig } from "ponder"

const rpc = process.env.PONDER_RPC_URL_1
if (!rpc) {
  throw new Error("PONDER_RPC_URL_1 is required")
}

export default createConfig({
  chains: {
    mainnet: {
      id: 1,
      rpc
    }
  },
  contracts: {}
})

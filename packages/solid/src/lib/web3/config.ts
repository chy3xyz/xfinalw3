import { walletConnect } from "@wagmi/connectors"
import { http, createConfig } from "@wagmi/solid"
import { foundry, localhost } from "viem/chains"
import scaffoldConfig from "../../../scaffold.config.js"
import { browserInjectedConnector } from "./injected.js"

export const SUPPORTED_CHAINS = [foundry, localhost] as const

export const CHAIN_CONFIG = {
  foundry: {
    id: foundry.id,
    name: "Foundry / Anvil",
    rpcUrl:
      scaffoldConfig.rpcOverrides?.[foundry.id] ?? "http://127.0.0.1:8545",
    fallbackRpcs: [] as string[],
    explorer: ""
  },
  localhost: {
    id: localhost.id,
    name: "Local EVM",
    rpcUrl: "http://127.0.0.1:8545",
    fallbackRpcs: [] as string[],
    explorer: ""
  }
} as const

export const DEFAULT_CHAIN = foundry
export const EXPECTED_CHAIN_ID = foundry.id

export const WALLETCONNECT_PROJECT_ID =
  scaffoldConfig.walletConnectProjectId.trim()

export function walletConnectEnabled(): boolean {
  return WALLETCONNECT_PROJECT_ID.length > 0
}

function buildConnectors() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const list: any[] = [browserInjectedConnector()]
  if (walletConnectEnabled()) {
    list.push(
      walletConnect({
        projectId: WALLETCONNECT_PROJECT_ID,
        showQrModal: true,
        metadata: {
          name: "Xfinalw3",
          description: "Xfinalw3 Solid dApp scaffold",
          url:
            typeof window !== "undefined"
              ? window.location.origin
              : "http://localhost:5173",
          icons: []
        }
      })
    )
  }
  return list
}

export const config = createConfig({
  chains: [foundry, localhost],
  connectors: buildConnectors(),
  transports: {
    [foundry.id]: http(CHAIN_CONFIG.foundry.rpcUrl),
    [localhost.id]: http(CHAIN_CONFIG.localhost.rpcUrl)
  }
})

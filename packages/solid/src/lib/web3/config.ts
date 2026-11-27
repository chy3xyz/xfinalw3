import { walletConnect } from "@wagmi/connectors"
import { http, createConfig } from "@wagmi/solid"
import type { Chain } from "viem"
import { foundry, localhost } from "viem/chains"
import scaffoldConfig from "../../../scaffold.config.js"
import { browserInjectedConnector } from "./injected.js"

/** Networks enabled for this scaffold build (from VITE_TARGET_CHAINS). */
export const SUPPORTED_CHAINS = scaffoldConfig.targetNetworks as readonly Chain[]

const fallbackLocal = [foundry, localhost] as const

function buildChainConfig() {
  const out: Record<
    string,
    {
      id: number
      name: string
      rpcUrl: string
      fallbackRpcs: string[]
      explorer: string
    }
  > = {}
  for (const chain of SUPPORTED_CHAINS) {
    const key = chain.id === foundry.id ? "foundry" : chain.name.toLowerCase()
    out[key] = {
      id: chain.id,
      name: chain.name,
      rpcUrl:
        scaffoldConfig.rpcOverrides?.[chain.id] ??
        (chain.id === foundry.id || chain.id === localhost.id
          ? "http://127.0.0.1:8545"
          : ""),
      fallbackRpcs: [],
      explorer: chain.blockExplorers?.default?.url ?? ""
    }
  }
  if (!out.foundry) {
    out.foundry = {
      id: foundry.id,
      name: "Foundry / Anvil",
      rpcUrl: "http://127.0.0.1:8545",
      fallbackRpcs: [],
      explorer: ""
    }
  }
  if (!out.localhost) {
    out.localhost = {
      id: localhost.id,
      name: "Local EVM",
      rpcUrl: "http://127.0.0.1:8545",
      fallbackRpcs: [],
      explorer: ""
    }
  }
  return out
}

export const CHAIN_CONFIG = buildChainConfig()

export const DEFAULT_CHAIN = SUPPORTED_CHAINS[0] ?? foundry
export const EXPECTED_CHAIN_ID = DEFAULT_CHAIN.id

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

const wagmiChains =
  SUPPORTED_CHAINS.length > 0
    ? ([...SUPPORTED_CHAINS] as [Chain, ...Chain[]])
    : ([...fallbackLocal] as unknown as [Chain, ...Chain[]])

const transports: Record<number, ReturnType<typeof http>> = {}
for (const chain of wagmiChains) {
  const rpc =
    scaffoldConfig.rpcOverrides?.[chain.id] ||
    CHAIN_CONFIG.foundry?.rpcUrl ||
    "http://127.0.0.1:8545"
  transports[chain.id] = http(rpc)
}

export const config = createConfig({
  chains: wagmiChains,
  connectors: buildConnectors(),
  transports
})

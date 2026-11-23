import { type Chain, foundry } from "viem/chains"

export type ScaffoldConfig = {
  targetNetworks: readonly Chain[]
  pollingInterval: number
  walletConnectProjectId: string
  rpcOverrides?: Record<number, string>
}

const isDev = import.meta.env.DEV

function resolveWalletConnectProjectId(): string {
  const fromEnv =
    (import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID as string | undefined) ||
    (import.meta.env.VITE_PROJECT_ID as string | undefined) ||
    (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined)
  if (fromEnv?.trim()) return fromEnv.trim()
  if (isDev) {
    console.warn(
      "[scaffold.config] WalletConnect project id unset; WC connector disabled in this session."
    )
    return ""
  }
  throw new Error("VITE_WALLET_CONNECT_PROJECT_ID is required in production.")
}

function resolveRpcUrl(): string {
  const fromEnv = (import.meta.env.VITE_RPC_URL as string | undefined)?.trim()
  if (fromEnv) return fromEnv
  // Same-origin gated proxy → indexer POST /rpc (set RPC_GATEWAY_UPSTREAM there).
  // Opt out with VITE_USE_RPC_PROXY=0 to hit Anvil directly.
  if (import.meta.env.VITE_USE_RPC_PROXY === "0") {
    return "http://127.0.0.1:8545"
  }
  return "/api/rpc"
}

const scaffoldConfig = {
  targetNetworks: [foundry],
  pollingInterval: 12_000,
  walletConnectProjectId: resolveWalletConnectProjectId(),
  rpcOverrides: {
    [foundry.id]: resolveRpcUrl()
  }
} as const satisfies ScaffoldConfig

export default scaffoldConfig

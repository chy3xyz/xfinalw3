import * as chains from "viem/chains"

export type BaseConfig = {
  targetNetworks: readonly chains.Chain[]
  pollingInterval: number
  alchemyApiKey: string
  rpcOverrides?: Record<number, string>
  walletConnectProjectId: string
  onlyLocalBurnerWallet: boolean
}

export type ScaffoldConfig = BaseConfig

/** Shared placeholders — DEV ONLY. Never used silently in production. */
export const DEFAULT_ALCHEMY_API_KEY = "wr5o5O6p1sAth83kLlHKp"
const DEFAULT_WALLET_CONNECT_PROJECT_ID = "3a8170812b534d0ff9d794f19a901d64"

const isDev = import.meta.env.DEV

function resolveAlchemyApiKey(): string {
  const fromEnv = import.meta.env.VITE_ALCHEMY_API_KEY as string | undefined
  if (fromEnv) return fromEnv
  if (isDev) {
    console.warn(
      "[scaffold.config] VITE_ALCHEMY_API_KEY is unset; using shared placeholder (dev only)."
    )
    return DEFAULT_ALCHEMY_API_KEY
  }
  throw new Error(
    "VITE_ALCHEMY_API_KEY is required in production. Set it in the environment."
  )
}

function resolveWalletConnectProjectId(): string {
  const fromEnv =
    (import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID as string | undefined) ||
    (import.meta.env.VITE_PROJECT_ID as string | undefined)
  if (fromEnv) return fromEnv
  if (isDev) {
    console.warn(
      "[scaffold.config] VITE_WALLET_CONNECT_PROJECT_ID / VITE_PROJECT_ID is unset; using shared placeholder (dev only)."
    )
    return DEFAULT_WALLET_CONNECT_PROJECT_ID
  }
  throw new Error(
    "VITE_WALLET_CONNECT_PROJECT_ID (or VITE_PROJECT_ID) is required in production. Set it in the environment."
  )
}

const scaffoldConfig = {
  // The networks on which your DApp is live
  targetNetworks: [chains.foundry],
  // The interval at which your front-end polls the RPC servers for new data
  pollingInterval: 30000,
  alchemyApiKey: resolveAlchemyApiKey(),
  // If you want to use a different RPC for a specific network, you can add it here.
  rpcOverrides: {
    // Local Anvil chain (Foundry) - default port 8545
    [chains.foundry.id]: "http://127.0.0.1:8545"
    // Example:
    // [chains.mainnet.id]: "https://mainnet.rpc.buidlguidl.com",
  },
  walletConnectProjectId: resolveWalletConnectProjectId(),
  onlyLocalBurnerWallet: true
} as const satisfies ScaffoldConfig

export default scaffoldConfig

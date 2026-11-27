import {
  type Chain,
  foundry,
  localhost,
  mainnet,
  sepolia
} from "viem/chains"

export type ScaffoldConfig = {
  targetNetworks: readonly Chain[]
  pollingInterval: number
  walletConnectProjectId: string
  rpcOverrides?: Record<number, string>
}

const isDev = import.meta.env.DEV

const NAMED_CHAINS: Record<string, Chain> = {
  foundry,
  anvil: foundry,
  localhost,
  sepolia,
  mainnet
}

/**
 * Comma-separated chain keys from env, e.g. `foundry,sepolia`.
 * Default: foundry only (local-first scaffold).
 */
function resolveTargetNetworks(): Chain[] {
  const raw = (
    import.meta.env.VITE_TARGET_CHAINS as string | undefined
  )?.trim()
  if (!raw) return [foundry]
  const out: Chain[] = []
  for (const part of raw.split(",")) {
    const key = part.trim().toLowerCase()
    const chain = NAMED_CHAINS[key]
    if (chain && !out.some((c) => c.id === chain.id)) out.push(chain)
  }
  return out.length > 0 ? out : [foundry]
}

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

function resolveRpcUrl(chainId: number): string {
  const keyed = (
    import.meta.env[`VITE_RPC_URL_${chainId}`] as string | undefined
  )?.trim()
  if (keyed) return keyed

  const fromEnv = (import.meta.env.VITE_RPC_URL as string | undefined)?.trim()
  if (fromEnv) return fromEnv

  if (chainId === foundry.id || chainId === localhost.id) {
    if (import.meta.env.VITE_USE_RPC_PROXY === "0") {
      return "http://127.0.0.1:8545"
    }
    return "/api/rpc"
  }

  throw new Error(
    `Missing RPC for chain ${chainId}. Set VITE_RPC_URL_${chainId} or VITE_RPC_URL.`
  )
}

const targetNetworks = resolveTargetNetworks()

const rpcOverrides: Record<number, string> = {}
for (const chain of targetNetworks) {
  try {
    rpcOverrides[chain.id] = resolveRpcUrl(chain.id)
  } catch (e) {
    if (isDev) {
      console.warn("[scaffold.config]", (e as Error).message)
      if (chain.id === foundry.id) {
        rpcOverrides[chain.id] = "http://127.0.0.1:8545"
      }
    } else {
      throw e
    }
  }
}

const scaffoldConfig = {
  targetNetworks,
  pollingInterval: 12_000,
  walletConnectProjectId: resolveWalletConnectProjectId(),
  rpcOverrides
} as const satisfies ScaffoldConfig

export default scaffoldConfig

import { http, type Chain, type PublicClient, createPublicClient } from "viem"
import { foundry, localhost } from "viem/chains"
import scaffoldConfig from "../../../scaffold.config.js"
import { CHAIN_CONFIG, DEFAULT_CHAIN, SUPPORTED_CHAINS } from "./config.js"

export { foundry, localhost }
export { formatEther, parseEther, parseUnits } from "viem"

const _clientCache = new Map<string, PublicClient>()

function rpcFor(chain: Chain): string {
  const override = scaffoldConfig.rpcOverrides?.[chain.id]
  if (override) return override
  if (chain.id === foundry.id || chain.id === localhost.id) {
    return CHAIN_CONFIG.foundry?.rpcUrl || "http://127.0.0.1:8545"
  }
  const named = Object.values(CHAIN_CONFIG).find((c) => c.id === chain.id)
  if (named?.rpcUrl) return named.rpcUrl
  return "http://127.0.0.1:8545"
}

export function resolveChain(chainId?: number): Chain {
  if (chainId !== undefined) {
    const hit = SUPPORTED_CHAINS.find((c) => c.id === chainId)
    if (hit) return hit
    if (chainId === foundry.id) return foundry
    if (chainId === localhost.id) return localhost
  }
  return DEFAULT_CHAIN
}

export function getPublicClient(chain: Chain = DEFAULT_CHAIN): PublicClient {
  const cacheKey = String(chain.id)
  const cached = _clientCache.get(cacheKey)
  if (cached) return cached

  const client = createPublicClient({
    chain,
    transport: http(rpcFor(chain), {
      retryCount: 1,
      retryDelay: 400,
      timeout: 12_000
    }),
    batch: { multicall: true }
  }) as PublicClient

  _clientCache.set(cacheKey, client)
  return client
}

import { http, type Chain, type PublicClient, createPublicClient } from "viem"
import { foundry, localhost } from "viem/chains"
import { CHAIN_CONFIG, DEFAULT_CHAIN } from "./config.js"

export { foundry, localhost }
export { formatEther, parseEther, parseUnits } from "viem"

const _clientCache = new Map<string, PublicClient>()

function cfgKeyFor(chain: Chain): keyof typeof CHAIN_CONFIG {
  if (chain.id === foundry.id || chain.id === 31337) return "foundry"
  return "localhost"
}

export function getPublicClient(chain: Chain = DEFAULT_CHAIN): PublicClient {
  const cacheKey = String(chain.id)
  const cached = _clientCache.get(cacheKey)
  if (cached) return cached

  const cfg = CHAIN_CONFIG[cfgKeyFor(chain)]
  const client = createPublicClient({
    chain,
    transport: http(cfg.rpcUrl, {
      retryCount: 1,
      retryDelay: 400,
      timeout: 12_000
    }),
    batch: { multicall: true }
  }) as PublicClient

  _clientCache.set(cacheKey, client)
  return client
}

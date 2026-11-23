/**
 * Shared API runtime helpers (from mmm ponder/src/api/runtime.ts).
 *
 * - createLimiter: cap concurrent RPC / fan-out work (avoids upstream 429 storms)
 * - apiRpcUrl: resolve RPC from env for admin/ops helpers
 */

/** Fixed-concurrency gate: excess calls queue until a slot frees. */
export function createLimiter(max: number) {
  let active = 0
  const queue: Array<() => void> = []
  return async function limit<T>(fn: () => Promise<T>): Promise<T> {
    if (active >= max) await new Promise<void>((resolve) => queue.push(resolve))
    active += 1
    try {
      return await fn()
    } finally {
      active -= 1
      queue.shift()?.()
    }
  }
}

/** Prefer chain-specific env; fall back to PONDER_RPC_URL_1 / OPS_RPC_URL. */
export function apiRpcUrl(): string {
  const url =
    process.env.OPS_RPC_URL ||
    process.env.PONDER_RPC_URL_1 ||
    process.env.BSC_RPC_URL ||
    process.env.PONDER_RPC_URL_56 ||
    ""
  if (!url) {
    throw new Error(
      "No RPC configured (OPS_RPC_URL / PONDER_RPC_URL_1 / BSC_RPC_URL)"
    )
  }
  return url
}

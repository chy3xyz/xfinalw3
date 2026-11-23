/**
 * Public JSON-RPC proxy pure logic (from mmm job/lib/rpc_gateway_core.mjs).
 * No network / no env — unit-testable.
 *
 * Gates: method deny prefixes, allow-list, batch size, weighted per-IP token bucket.
 */

export const BLOCKED_PREFIXES = [
  "debug_",
  "trace_",
  "admin_",
  "txpool_",
  "personal_",
  "miner_",
  "les_",
  "eth_sendBundle",
  "eth_cancelBundle"
] as const

export const DEFAULT_ALLOW_METHODS = [
  "eth_chainId",
  "net_version",
  "web3_clientVersion",
  "eth_blockNumber",
  "eth_getBlockByNumber",
  "eth_getBlockByHash",
  "eth_gasPrice",
  "eth_feeHistory",
  "eth_maxPriorityFeePerGas",
  "eth_blobBaseFee",
  "eth_call",
  "eth_estimateGas",
  "eth_getCode",
  "eth_getStorageAt",
  "eth_getBalance",
  "eth_getTransactionCount",
  "eth_getLogs",
  "eth_getTransactionByHash",
  "eth_getTransactionReceipt",
  "eth_getTransactionByBlockNumberAndIndex",
  "eth_getBlockTransactionCountByNumber",
  "eth_sendRawTransaction",
  "eth_subscribe",
  "eth_unsubscribe"
] as const

export const METHOD_WEIGHTS: Record<string, number> = {
  eth_getLogs: 5,
  eth_getBlockByNumber: 3,
  eth_getBlockByHash: 3,
  eth_getTransactionReceipt: 2,
  eth_feeHistory: 2
}

export function methodWeight(method: string): number {
  return METHOD_WEIGHTS[method] || 1
}

export type ParseOk = {
  ok: true
  isBatch: boolean
  methods: string[]
  count: number
}
export type ParseErr = { ok: false; code: number; message: string }
export type ParseResult = ParseOk | ParseErr

export function parseRpcBody(raw: string): ParseResult {
  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return { ok: false, code: -32700, message: "parse error" }
  }
  const list = Array.isArray(body) ? body : [body]
  if (list.length === 0)
    return { ok: false, code: -32600, message: "empty batch" }
  const methods: string[] = []
  for (const item of list) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof (item as { method?: unknown }).method !== "string" ||
      !(item as { method: string }).method.length
    ) {
      return { ok: false, code: -32600, message: "invalid request" }
    }
    methods.push((item as { method: string }).method)
  }
  return {
    ok: true,
    isBatch: Array.isArray(body),
    methods,
    count: list.length
  }
}

export function classifyMethods(
  methods: string[],
  {
    allow = DEFAULT_ALLOW_METHODS as readonly string[],
    allowUnknown = true
  }: { allow?: readonly string[]; allowUnknown?: boolean } = {}
) {
  const allowSet = new Set(allow)
  const blocked: string[] = []
  const unknown: string[] = []
  for (const m of methods) {
    if (BLOCKED_PREFIXES.some((p) => m.startsWith(p))) {
      blocked.push(m)
      continue
    }
    if (!allowSet.has(m)) unknown.push(m)
  }
  return { blocked, unknown: allowUnknown ? unknown : unknown }
}

export function rejectReason(
  parsed: ParseResult,
  {
    maxBatch = 50,
    allow,
    allowUnknown = true
  }: {
    maxBatch?: number
    allow?: readonly string[]
    allowUnknown?: boolean
  } = {}
): { code: number; message: string } | null {
  if (!parsed.ok) return { code: parsed.code, message: parsed.message }
  if (parsed.count > maxBatch) {
    return {
      code: -32600,
      message: `batch too large (${parsed.count} > ${maxBatch})`
    }
  }
  const { blocked, unknown } = classifyMethods(parsed.methods, {
    allow,
    allowUnknown
  })
  if (blocked.length) {
    return {
      code: -32601,
      message: `method not allowed: ${[...new Set(blocked)].join(",")}`
    }
  }
  if (!allowUnknown && unknown.length) {
    return {
      code: -32601,
      message: `method not allowed: ${[...new Set(unknown)].join(",")}`
    }
  }
  return null
}

export function requestCost(methods: string[]): number {
  let sum = 0
  for (const m of methods) sum += methodWeight(m)
  return sum
}

export function makeLimiter({
  perMin = 600,
  burst = 120,
  idleMs = 10 * 60 * 1000
}: { perMin?: number; burst?: number; idleMs?: number } = {}) {
  const buckets = new Map<string, { tokens: number; updated: number }>()
  const ratePerMs = perMin / 60000
  return {
    take(ip: string, cost: number, nowMs: number) {
      let b = buckets.get(ip)
      if (!b) {
        b = { tokens: burst, updated: nowMs }
        buckets.set(ip, b)
      } else {
        const dt = Math.max(0, nowMs - b.updated)
        b.tokens = Math.min(burst, b.tokens + dt * ratePerMs)
        b.updated = nowMs
      }
      if (b.tokens >= cost) {
        b.tokens -= cost
        return { ok: true as const, tokens: b.tokens, retryAfterSec: 0 }
      }
      const need = cost - b.tokens
      return {
        ok: false as const,
        tokens: b.tokens,
        retryAfterSec: Math.max(1, Math.ceil(need / ratePerMs / 1000))
      }
    },
    sweep(nowMs: number) {
      for (const [ip, b] of buckets) {
        if (nowMs - b.updated > idleMs) buckets.delete(ip)
      }
    },
    size() {
      return buckets.size
    }
  }
}

export function corsHeaders(
  origin: string | null | undefined
): Record<string, string> {
  const o = origin && origin !== "null" ? origin : "*"
  return {
    "access-control-allow-origin": o,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type, accept, x-requested-with",
    "access-control-max-age": "86400",
    vary: "Origin"
  }
}

export function clientIpOf(
  headers: Record<string, string | string[] | undefined>,
  socketAddr = ""
): string {
  const xff = headers["x-forwarded-for"]
  if (typeof xff === "string" && xff.trim()) return xff.split(",")[0]!.trim()
  if (Array.isArray(xff) && xff.length) {
    return String(xff[0]).split(",")[0]!.trim()
  }
  const real = headers["x-real-ip"]
  if (typeof real === "string" && real.trim()) return real.trim()
  return socketAddr || "unknown"
}

export function makeStats({ topN = 5 }: { topN?: number } = {}) {
  const ips = new Map<string, { req: number; cost: number; rejected: number }>()
  const methods = new Map<string, number>()
  const origins = new Map<string, number>()
  const rejectedBy = new Map<string, number>()
  let requests = 0
  let cost = 0
  let batches = 0
  let maxBatch = 0
  return {
    record(opts: {
      ip: string
      methods?: string[]
      origin?: string
      cost?: number
      rejected?: string | null
      isBatch?: boolean
    }) {
      const ms = opts.methods ?? []
      const c = opts.cost ?? 0
      const origin = opts.origin || ""
      requests++
      cost += c
      if (opts.isBatch) {
        batches++
        maxBatch = Math.max(maxBatch, ms.length)
      }
      const e = ips.get(opts.ip) || { req: 0, cost: 0, rejected: 0 }
      e.req++
      e.cost += c
      if (opts.rejected) e.rejected++
      ips.set(opts.ip, e)
      for (const m of ms) methods.set(m, (methods.get(m) || 0) + 1)
      origins.set(
        origin || "(none)",
        (origins.get(origin || "(none)") || 0) + 1
      )
      if (opts.rejected) {
        rejectedBy.set(opts.rejected, (rejectedBy.get(opts.rejected) || 0) + 1)
      }
    },
    snapshot() {
      return {
        requests,
        cost,
        batches,
        maxBatch,
        uniqueIps: ips.size,
        topIps: [...ips.entries()]
          .sort((a, b) => b[1].req - a[1].req)
          .slice(0, topN)
          .map(([ip, v]) => ({
            ip,
            req: v.req,
            cost: v.cost,
            rejected: v.rejected
          })),
        topMethods: [...methods.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, topN + 5)
          .map(([m, n]) => ({ method: m, n })),
        topOrigins: [...origins.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, topN)
          .map(([o, n]) => ({ origin: o, n })),
        rejected: [...rejectedBy.entries()].map(([r, n]) => ({
          reason: r,
          n
        }))
      }
    },
    reset() {
      ips.clear()
      methods.clear()
      origins.clear()
      rejectedBy.clear()
      requests = 0
      cost = 0
      batches = 0
      maxBatch = 0
    }
  }
}

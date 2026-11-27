/**
 * Gated JSON-RPC proxy for dApps (from mmm job/rpc_gateway.mjs).
 *
 * Mounts:
 *   OPTIONS|POST /rpc
 *   GET /rpc/__stats  (loopback / private only)
 *
 * Upstream key stays in indexer env — browsers hit /rpc (or /api/rpc via Vite).
 */
import type { Context, Hono } from "hono"
import {
  DEFAULT_ALLOW_METHODS,
  classifyMethods,
  clientIpOf,
  corsHeaders,
  makeLimiter,
  makeStats,
  parseRpcBody,
  rejectReason,
  requestCost
} from "./rpcGatewayCore"
import { apiRpcUrl } from "./runtime"
import { rpcAllowUnknownMethods } from "./runtimeEnv"

function envNum(name: string, fallback: number): number {
  const raw = process.env[name]
  if (raw === undefined || raw === "") return fallback
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function resolveUpstream(): string | null {
  const explicit =
    process.env.RPC_GATEWAY_UPSTREAM ||
    process.env.RPC_URL ||
    process.env.OPS_RPC_URL ||
    ""
  if (explicit) return explicit
  try {
    return apiRpcUrl()
  } catch {
    return null
  }
}

function rpcError(code: number, message: string, id: unknown = null) {
  return { jsonrpc: "2.0", id, error: { code, message } }
}

function json(
  status: number,
  body: unknown,
  extra: Record<string, string> = {}
): Response {
  const payload = JSON.stringify(body)
  return new Response(payload, {
    status,
    headers: {
      "content-type": "application/json",
      "content-length": String(Buffer.byteLength(payload)),
      ...extra
    }
  })
}

function headerMap(c: Context): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {}
  c.req.raw.headers.forEach((v, k) => {
    out[k.toLowerCase()] = v
  })
  return out
}

function isLocalStatsClient(c: Context): boolean {
  const ip = clientIpOf(headerMap(c))
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "unknown" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.")
  )
}

/**
 * Mount /rpc proxy. When upstream unset, POST /rpc returns 503
 * (indexer still boots).
 */
export function mountRpcProxy(app: Hono): void {
  const UPSTREAM = resolveUpstream()
  const PER_MIN = envNum("RPC_GATEWAY_PER_MIN", 3000)
  const BURST = envNum("RPC_GATEWAY_BURST", 600)
  const MAX_BATCH = envNum("RPC_GATEWAY_MAX_BATCH", 50)
  const MAX_BODY = envNum("RPC_GATEWAY_MAX_BODY", 256 * 1024)
  // Prod default: deny unknown methods. Dev default: allow. Override with 0|1.
  const ALLOW_UNKNOWN = rpcAllowUnknownMethods()
  const TIMEOUT_MS = envNum("RPC_GATEWAY_TIMEOUT_MS", 20_000)
  const STATS_SEC = envNum("RPC_GATEWAY_STATS_SEC", 300)

  if (!UPSTREAM) {
    console.warn(
      "[rpc-proxy] RPC_GATEWAY_UPSTREAM / RPC_URL / OPS_RPC_URL / PONDER_RPC_URL_1 unset — POST /rpc returns 503"
    )
  } else {
    console.warn(
      `[rpc-proxy] /rpc → ***${UPSTREAM.slice(-8)} perMin=${PER_MIN} burst=${BURST} maxBatch=${MAX_BATCH} allowUnknown=${ALLOW_UNKNOWN}`
    )
  }

  const limiter = makeLimiter({ perMin: PER_MIN, burst: BURST })
  const stats = makeStats()
  const startedAt = Date.now()

  if (STATS_SEC > 0) {
    const timer = setInterval(() => {
      limiter.sweep(Date.now())
      const s = stats.snapshot()
      if (!s.requests) return
      console.log(
        `${new Date().toISOString()} STATS rpc-proxy ` +
          `req=${s.requests} cost=${s.cost} ip=${s.uniqueIps} batch=${s.batches}(max ${s.maxBatch}) ` +
          `topIp=${s.topIps.map((x) => `${x.ip}:${x.req}`).join(" ") || "-"} ` +
          `methods=${s.topMethods
            .slice(0, 6)
            .map((m) => `${m.method}:${m.n}`)
            .join(" ")} ` +
          `rejected=${s.rejected.map((r) => `${r.reason}:${r.n}`).join(" ") || "-"}`
      )
      stats.reset()
    }, STATS_SEC * 1000)
    timer.unref?.()
  }

  async function forward(bodyText: string) {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(UPSTREAM!, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: bodyText,
        signal: ctrl.signal
      })
      const text = await res.text()
      return { ok: true as const, status: res.status, text }
    } catch (e) {
      const err = e as Error
      return {
        ok: false as const,
        status: 0,
        error: err.name === "AbortError" ? "upstream timeout" : err.message
      }
    } finally {
      clearTimeout(t)
    }
  }

  app.options("/rpc", (c) => {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(c.req.header("origin"))
    })
  })

  app.get("/rpc/__stats", (c) => {
    if (!isLocalStatsClient(c)) {
      return json(403, { error: "forbidden" })
    }
    return json(200, {
      uptimeSec: Math.round((Date.now() - startedAt) / 1000),
      limiterBuckets: limiter.size(),
      allowMethods: DEFAULT_ALLOW_METHODS.length,
      upstreamConfigured: Boolean(UPSTREAM),
      ...stats.snapshot()
    })
  })

  app.post("/rpc", async (c) => {
    const now = Date.now()
    const origin = c.req.header("origin") || ""
    const cors = corsHeaders(origin)
    const ip = clientIpOf(headerMap(c))

    if (!UPSTREAM) {
      return json(
        503,
        rpcError(-32603, "rpc proxy upstream not configured"),
        cors
      )
    }

    const rawBuf = await c.req.arrayBuffer()
    if (rawBuf.byteLength > MAX_BODY) {
      stats.record({
        ip,
        methods: [],
        origin,
        cost: 0,
        rejected: "body-too-large"
      })
      return json(
        413,
        rpcError(-32600, `request body too large (> ${MAX_BODY} bytes)`),
        cors
      )
    }

    const raw = new TextDecoder().decode(rawBuf)
    const parsed = parseRpcBody(raw)
    const methods = parsed.ok ? parsed.methods : []
    const cost = requestCost(methods)
    const reason = rejectReason(parsed, {
      maxBatch: MAX_BATCH,
      allowUnknown: ALLOW_UNKNOWN
    })
    if (reason) {
      stats.record({
        ip,
        methods: parsed.ok ? methods : [],
        origin,
        cost,
        rejected: reason.message,
        isBatch: parsed.ok && parsed.isBatch
      })
      if (parsed.ok) {
        const { blocked, unknown } = classifyMethods(parsed.methods, {
          allowUnknown: true
        })
        if (blocked.length || unknown.length) {
          console.log(
            `REJECT rpc ip=${ip} blocked=${blocked.join(",") || "-"} unknown=${unknown.join(",") || "-"} → ${reason.message}`
          )
        }
      }
      return json(200, rpcError(reason.code, reason.message), cors)
    }

    const gate = limiter.take(ip, cost, now)
    if (!gate.ok) {
      stats.record({
        ip,
        methods,
        origin,
        cost,
        rejected: "rate-limited",
        isBatch: parsed.ok && parsed.isBatch
      })
      return json(
        429,
        rpcError(-32005, `rate limited — retry in ${gate.retryAfterSec}s`),
        { ...cors, "retry-after": String(gate.retryAfterSec) }
      )
    }

    const up = await forward(raw)
    if (!up.ok) {
      stats.record({
        ip,
        methods,
        origin,
        cost,
        rejected: `upstream:${up.error}`,
        isBatch: parsed.ok && parsed.isBatch
      })
      return json(502, rpcError(-32603, `upstream error: ${up.error}`), cors)
    }
    stats.record({
      ip,
      methods,
      origin,
      cost,
      isBatch: parsed.ok && parsed.isBatch
    })
    return new Response(up.text, {
      status: up.status,
      headers: {
        "content-type": "application/json",
        ...cors
      }
    })
  })
}

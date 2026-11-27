/**
 * Request-id + structured access log for indexer Hono API.
 *
 * - Accepts inbound `X-Request-Id` or generates one
 * - Echoes it on the response
 * - Logs one JSON line per request when LOG_FORMAT=json (default in production)
 */
import { randomBytes } from "node:crypto"
import type { Context, Next } from "hono"
import { isProductionRuntime } from "./runtimeEnv"

export const REQUEST_ID_HEADER = "x-request-id"

export function newRequestId(): string {
  return randomBytes(8).toString("hex")
}

export function resolveRequestId(incoming: string | undefined): string {
  const v = (incoming || "").trim()
  if (v && /^[A-Za-z0-9._-]{8,128}$/.test(v)) return v
  return newRequestId()
}

function useJsonLogs(): boolean {
  const flag = process.env.LOG_FORMAT
  if (flag === "json") return true
  if (flag === "text") return false
  return isProductionRuntime()
}

export async function requestLog(c: Context, next: Next) {
  const id = resolveRequestId(c.req.header(REQUEST_ID_HEADER))
  c.set("requestId", id)
  c.header(REQUEST_ID_HEADER, id)

  const started = Date.now()
  try {
    await next()
  } finally {
    const ms = Date.now() - started
    const line = {
      ts: new Date().toISOString(),
      level: "info",
      svc: "indexer-api",
      msg: "http",
      requestId: id,
      method: c.req.method,
      path: new URL(c.req.url).pathname,
      status: c.res.status,
      ms
    }
    if (useJsonLogs()) {
      console.log(JSON.stringify(line))
    } else if (process.env.LOG_HTTP === "1") {
      console.log(
        `[http] ${line.method} ${line.path} ${line.status} ${line.ms}ms id=${id}`
      )
    }
  }
}

declare module "hono" {
  interface ContextVariableMap {
    requestId: string
  }
}

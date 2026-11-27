/**
 * Production static file server for packages/solid (.output/public)
 * with baseline security headers (CSP, COOP, …).
 *
 * Usage (from repo root, after `bun run build`):
 *   bun scripts/serve-solid-static.ts
 *   PORT=4173 bun scripts/serve-solid-static.ts
 */
import { join } from "node:path"
import { SECURITY_HEADERS } from "../packages/solid/src/lib/securityHeaders"

const ROOT = join(
  import.meta.dir,
  "..",
  "packages",
  "solid",
  ".output",
  "public"
)
const PORT = Number(process.env.PORT || process.env.SOLID_PORT || "3000")

function contentType(path: string): string | undefined {
  if (path.endsWith(".html")) return "text/html; charset=utf-8"
  if (path.endsWith(".js")) return "text/javascript; charset=utf-8"
  if (path.endsWith(".css")) return "text/css; charset=utf-8"
  if (path.endsWith(".json")) return "application/json"
  if (path.endsWith(".svg")) return "image/svg+xml"
  if (path.endsWith(".png")) return "image/png"
  if (path.endsWith(".ico")) return "image/x-icon"
  if (path.endsWith(".woff2")) return "font/woff2"
  if (path.endsWith(".gz")) return "application/gzip"
  return undefined
}

function withHeaders(extra?: Record<string, string>): HeadersInit {
  return { ...SECURITY_HEADERS, ...extra }
}

const indexFile = Bun.file(join(ROOT, "index.html"))
if (!(await indexFile.exists())) {
  console.error(
    `[serve-solid] missing ${join(ROOT, "index.html")} — run: bun run build`
  )
  process.exit(1)
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)
    let rel = decodeURIComponent(url.pathname)
    if (rel.includes("..")) {
      return new Response("Bad Request", { status: 400, headers: withHeaders() })
    }
    if (rel === "/" || rel === "") rel = "/index.html"
    const filePath = join(ROOT, rel)
    const file = Bun.file(filePath)
    if (await file.exists()) {
      const ct = contentType(rel)
      return new Response(file, {
        headers: withHeaders(ct ? { "Content-Type": ct } : undefined)
      })
    }
    // SPA fallback
    return new Response(indexFile, {
      headers: withHeaders({ "Content-Type": "text/html; charset=utf-8" })
    })
  }
})

console.log(`[serve-solid] http://127.0.0.1:${PORT}  root=${ROOT}`)

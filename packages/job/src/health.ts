import { logger } from "./utils/logger.js"

export function writesEnabled(): boolean {
  return process.env.CRON_WRITE_ENABLED === "true"
}

export function startHealthServer(): ReturnType<typeof Bun.serve> {
  const port = parseInt(process.env.CRON_HEALTH_PORT || "3001", 10)

  const server = Bun.serve({
    port,
    fetch(req) {
      const url = new URL(req.url)
      if (req.method === "GET" && url.pathname === "/health") {
        return Response.json({ ok: true, writesEnabled: writesEnabled() })
      }
      return new Response("Not Found", { status: 404 })
    }
  })

  logger.info(`Health server listening on http://127.0.0.1:${port}/health`)
  return server
}

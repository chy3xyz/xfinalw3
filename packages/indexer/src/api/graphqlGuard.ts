/**
 * GraphQL edge hardening:
 * - API key (x-api-key or ?api_key=) required in production by default
 * - deny-list of sensitive field names in the raw query document
 *
 * Clone the request body before reading so bponder graphql middleware
 * can still parse POST JSON.
 */
import { createHash, timingSafeEqual } from "node:crypto"
import type { Context, Next } from "hono"
import { graphqlApiKeyRequired } from "./runtimeEnv"

const GRAPHQL_API_KEY = process.env.GRAPHQL_API_KEY || ""

/**
 * Word-boundary patterns for fields that must not be selected publicly.
 * Add entries when schema gains sensitive columns (signatures, secrets, …).
 */
export const SENSITIVE_GRAPHQL_FIELDS: readonly RegExp[] = [
  // scaffold: empty — product apps add e.g. /\bsigBuyer\b/
]

function constantTimeEqual(a: string, b: string): boolean {
  return timingSafeEqual(
    createHash("sha256").update(a).digest(),
    createHash("sha256").update(b).digest()
  )
}

export async function graphqlGuard(c: Context, next: Next) {
  const url = new URL(c.req.url)
  if (url.pathname !== "/" && url.pathname !== "/graphql") return next()

  const requireKey = graphqlApiKeyRequired()
  if (requireKey && !GRAPHQL_API_KEY) {
    console.error(
      "[graphql-guard] GRAPHQL_API_KEY required in production (or set GRAPHQL_REQUIRE_API_KEY=0 to opt out)"
    )
    return c.json({ error: "graphql api key not configured" }, 503)
  }

  if (GRAPHQL_API_KEY) {
    const provided =
      c.req.header("x-api-key") ?? url.searchParams.get("api_key") ?? ""
    if (!constantTimeEqual(provided, GRAPHQL_API_KEY)) {
      return c.json({ error: "unauthorized" }, 401)
    }
  }

  if (SENSITIVE_GRAPHQL_FIELDS.length === 0) return next()

  let queryText = ""
  if (c.req.method === "GET") {
    queryText = url.searchParams.get("query") ?? ""
  } else if (c.req.method === "POST") {
    const body = await c.req.raw
      .clone()
      .json()
      .catch(() => null)
    if (
      typeof body === "object" &&
      body !== null &&
      typeof (body as Record<string, unknown>).query === "string"
    ) {
      queryText = (body as { query: string }).query
    }
  }
  if (SENSITIVE_GRAPHQL_FIELDS.some((re) => re.test(queryText))) {
    return c.json({ error: "field not allowed" }, 403)
  }
  return next()
}

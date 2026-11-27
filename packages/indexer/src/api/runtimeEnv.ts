/**
 * Shared env helpers for API edge defaults.
 * Production = NODE_ENV=production or BPONDER_ENV=production.
 */
export function isProductionRuntime(): boolean {
  const node = (process.env.NODE_ENV || "").toLowerCase()
  const ponder = (process.env.BPONDER_ENV || "").toLowerCase()
  return node === "production" || ponder === "production"
}

/**
 * GraphQL API key required when:
 * - GRAPHQL_REQUIRE_API_KEY=1, or
 * - production and GRAPHQL_REQUIRE_API_KEY is not explicitly "0"
 */
export function graphqlApiKeyRequired(): boolean {
  const flag = process.env.GRAPHQL_REQUIRE_API_KEY
  if (flag === "1") return true
  if (flag === "0") return false
  return isProductionRuntime()
}

/**
 * Unknown JSON-RPC methods:
 * - explicit RPC_GATEWAY_ALLOW_UNKNOWN=0|1 wins
 * - else allow in non-prod, deny in prod
 */
export function rpcAllowUnknownMethods(): boolean {
  const flag = process.env.RPC_GATEWAY_ALLOW_UNKNOWN
  if (flag === "0") return false
  if (flag === "1") return true
  return !isProductionRuntime()
}

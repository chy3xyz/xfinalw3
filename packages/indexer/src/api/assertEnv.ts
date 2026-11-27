import {
  graphqlApiKeyRequired,
  isProductionRuntime,
  rpcAllowUnknownMethods
} from "./runtimeEnv"

/** Boot-time warnings / soft asserts for the Hono API process. */
export function warnIndexerApiEnv(): void {
  const prod = isProductionRuntime()
  if (graphqlApiKeyRequired() && !process.env.GRAPHQL_API_KEY) {
    console.error(
      "[env] GRAPHQL_API_KEY missing while required — /graphql returns 503 until set (or GRAPHQL_REQUIRE_API_KEY=0)"
    )
  }
  if (prod && rpcAllowUnknownMethods()) {
    console.warn(
      "[env] RPC_GATEWAY_ALLOW_UNKNOWN enabled in production — unknown eth_ methods are allowed"
    )
  }
  if (!process.env.PONDER_RPC_URL_1) {
    console.warn("[env] PONDER_RPC_URL_1 should be set for indexing + rpc fallback")
  }
}

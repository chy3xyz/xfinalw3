/** Keep in sync with `contracts` in ponder.config.ts and src/index.ts handlers. */
export function counterConfigured(): boolean {
  if (process.env.COUNTER_ADDRESS === "") return false
  if (process.env.COUNTER_ADDRESS) return true
  const chainId = process.env.PONDER_CHAIN_ID || "31337"
  return chainId === "31337"
}

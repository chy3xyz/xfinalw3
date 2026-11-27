/**
 * Client env checklist. Production WC id is enforced in scaffold.config.ts;
 * this helper is for explicit boot / docs / scripts.
 */
export type SolidEnvReport = {
  ok: boolean
  missing: string[]
  warnings: string[]
}

export function inspectSolidEnv(): SolidEnvReport {
  const missing: string[] = []
  const warnings: string[] = []
  const isProd = import.meta.env.PROD

  const wc =
    (import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID as string | undefined) ||
    (import.meta.env.VITE_PROJECT_ID as string | undefined)
  if (!wc?.trim()) {
    if (isProd) missing.push("VITE_WALLET_CONNECT_PROJECT_ID")
    else warnings.push("VITE_WALLET_CONNECT_PROJECT_ID unset (WC disabled)")
  }

  const chains = (import.meta.env.VITE_TARGET_CHAINS as string | undefined)?.trim()
  if (chains && /sepolia|mainnet/i.test(chains)) {
    const needs = chains
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s === "sepolia" || s === "mainnet")
    for (const name of needs) {
      const id = name === "sepolia" ? 11155111 : 1
      const keyed = (
        import.meta.env[`VITE_RPC_URL_${id}`] as string | undefined
      )?.trim()
      const generic = (import.meta.env.VITE_RPC_URL as string | undefined)?.trim()
      if (!keyed && !generic) {
        missing.push(`VITE_RPC_URL_${id} (or VITE_RPC_URL) for ${name}`)
      }
    }
  }

  return { ok: missing.length === 0, missing, warnings }
}

export function assertSolidEnv(): void {
  const report = inspectSolidEnv()
  for (const w of report.warnings) console.warn(`[env] ${w}`)
  if (!report.ok) {
    throw new Error(`[env] missing: ${report.missing.join(", ")}`)
  }
}

/**
 * Baseline browser security headers for the Solid static dApp.
 * Used by `scripts/serve-solid-static.ts` and mirrored in `public/_headers`.
 *
 * CSP allows WalletConnect / Reown + local Anvil RPC. Tighten per product.
 */
export const CSP_VALUE = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss: http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:*",
  "frame-src 'self' https:",
  "worker-src 'self' blob:",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'"
].join("; ")

export const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": CSP_VALUE,
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cross-Origin-Opener-Policy": "same-origin"
}

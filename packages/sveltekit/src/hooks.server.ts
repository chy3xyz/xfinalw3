import type { Handle, HandleServerError } from "@sveltejs/kit"

/** WalletConnect-friendly baseline CSP (connect/frame allow https/wss). */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
  "frame-src 'self' https:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join("; ")

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": CONTENT_SECURITY_POLICY
}

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event)

  try {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(name, value)
    }
    return response
  } catch {
    // Some responses have immutable headers (e.g. redirects).
    const headers = new Headers(response.headers)
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      headers.set(name, value)
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    })
  }
}

export const handleError: HandleServerError = ({ error, event, kind }) => {
  if (kind === "app") {
    return error
  }

  if (kind === "framework") {
    return error
  }

  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  console.error("[Server Error] ==========================================")
  console.error("[Server Error] URL:", event.url.pathname)
  console.error("[Server Error] Kind:", kind)
  console.error("[Server Error] Error:", errorMessage)
  if (errorStack) {
    console.error("[Server Error] Stack:", errorStack)
  }
  if (error instanceof Error && "cause" in error) {
    console.error(
      "[Server Error] Cause:",
      (error as Error & { cause?: unknown }).cause
    )
  }
  console.error("[Server Error] ==========================================")

  return {
    message: "Something went wrong"
  }
}

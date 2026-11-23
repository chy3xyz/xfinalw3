// Invite helpers — ported from MMM (ref query + pending localStorage).
// Scaffold: invite code is derived from the connected wallet until an on-chain
// registry (inviteCodeOf) is wired. Link shape stays `?ref=CODE` like MMM.

export const INVITE_CODE_LENGTH = 7

/** Same format bar as MMM: 7 uppercase alphanumerics. */
const INVITE_RE = /^[A-Z0-9]{7}$/

const PENDING_REF_KEY = "xfinalw3_pending_ref"

export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "")
}

export function isValidInviteCodeFormat(code: string): boolean {
  return INVITE_RE.test(code)
}

export function inviteCodeFromRefParam(
  ref: string | string[] | null | undefined
): string {
  const raw = Array.isArray(ref) ? ref[0] : ref
  if (!raw) return ""
  return normalizeInviteCode(raw)
}

/**
 * Scaffold stand-in for on-chain inviteCodeOf(address).
 * Uses 7 hex chars from the address (stable per wallet).
 * Replace with contract read when you ship a registry.
 */
export function inviteCodeFromAddress(
  address: string | null | undefined
): string {
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) return ""
  return address.slice(2, 2 + INVITE_CODE_LENGTH).toUpperCase()
}

export function buildInviteLink(code: string, origin?: string): string {
  if (!code || !isValidInviteCodeFormat(code)) return ""
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : "")
  if (!base) return ""
  return `${base}/me?ref=${encodeURIComponent(code)}`
}

function pendingRefStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage
  } catch {
    return null
  }
}

/** Persist a format-valid ref so tab navigations don't drop `?ref=`. */
export function rememberPendingRef(code: string): boolean {
  const normalized = normalizeInviteCode(code)
  if (!isValidInviteCodeFormat(normalized)) return false
  const store = pendingRefStorage()
  if (!store) return false
  try {
    store.setItem(PENDING_REF_KEY, normalized)
    return true
  } catch {
    return false
  }
}

export function readPendingRef(): string {
  const store = pendingRefStorage()
  if (!store) return ""
  try {
    const raw = store.getItem(PENDING_REF_KEY)
    if (!raw) return ""
    const code = normalizeInviteCode(raw)
    if (!isValidInviteCodeFormat(code)) {
      store.removeItem(PENDING_REF_KEY)
      return ""
    }
    return code
  } catch {
    return ""
  }
}

export function clearPendingRef(): void {
  const store = pendingRefStorage()
  if (!store) return
  try {
    store.removeItem(PENDING_REF_KEY)
  } catch {
    /* ignore */
  }
}

/** URL ref (if valid) wins over stored pending ref. */
export function resolveInviteCode(
  ref: string | string[] | null | undefined
): string {
  const fromUrl = inviteCodeFromRefParam(ref)
  if (isValidInviteCodeFormat(fromUrl)) return fromUrl
  return readPendingRef()
}

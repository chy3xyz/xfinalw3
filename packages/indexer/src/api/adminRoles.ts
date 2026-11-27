/**
 * Pure admin role helpers (no env / cookie side effects).
 */
export type AdminRole = "viewer" | "operator" | "owner"

export const ROLE_RANK: Record<AdminRole, number> = {
  viewer: 1,
  operator: 2,
  owner: 3
}

export function isAdminRole(v: unknown): v is AdminRole {
  return v === "viewer" || v === "operator" || v === "owner"
}

export function roleAtLeast(role: AdminRole, required: AdminRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[required]
}

/**
 * Parse ADMIN_ACCOUNTS + optional single ADMIN_USERNAME/HASH/ROLE.
 * Pure: takes an env-like record (defaults to process.env).
 */
export function parseAdminAccounts(
  env: Record<string, string | undefined> = process.env
): Map<string, { hash: string; role: AdminRole }> {
  const accounts = new Map<string, { hash: string; role: AdminRole }>()
  const user = env.ADMIN_USERNAME || "admin"
  const hash = env.ADMIN_PASSWORD_SHA256 || ""
  const roleEnv = env.ADMIN_ROLE
  if (user && hash) {
    accounts.set(user, {
      hash: hash.toLowerCase(),
      role: isAdminRole(roleEnv) ? roleEnv : "owner"
    })
  }
  for (const part of (env.ADMIN_ACCOUNTS || "").split(/[,;]/)) {
    const item = part.trim()
    if (!item) continue
    const [name, h, role] = item.split(":")
    if (!name || !h || !/^[0-9a-fA-F]{64}$/.test(h)) continue
    accounts.set(name, {
      hash: h.toLowerCase(),
      role: isAdminRole(role) ? role : "viewer"
    })
  }
  return accounts
}

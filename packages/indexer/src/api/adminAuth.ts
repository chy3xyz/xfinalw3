/**
 * Admin cookie-session auth for indexer Hono API
 * (extracted & product-agnostic from mmm ponder/src/api admin auth).
 *
 * Roles (ascending): viewer ⊂ operator ⊂ owner
 *
 * Env:
 *   ADMIN_USERNAME + ADMIN_PASSWORD_SHA256 [+ ADMIN_ROLE]
 *   ADMIN_ACCOUNTS="name:sha256hex:role,..."
 *   ADMIN_SESSION_SECRET | SESSION_SECRET_FILE
 *   KEEPER_SECRET — optional machine channel header `X-Keeper-Secret`
 */
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual
} from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import type { Context, Next } from "hono"
import { Hono } from "hono"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"

export type AdminRole = "viewer" | "operator" | "owner"

export const ROLE_RANK: Record<AdminRole, number> = {
  viewer: 1,
  operator: 2,
  owner: 3
}

const isRole = (v: unknown): v is AdminRole =>
  v === "viewer" || v === "operator" || v === "owner"

const SESSION_COOKIE = process.env.ADMIN_SESSION_COOKIE || "xfinalw3_admin"
const SESSION_TTL_SEC = 12 * 60 * 60

function constantTimeEqual(a: string, b: string): boolean {
  return timingSafeEqual(
    createHash("sha256").update(a).digest(),
    createHash("sha256").update(b).digest()
  )
}

function parseAccountsConfig(): Map<string, { hash: string; role: AdminRole }> {
  const accounts = new Map<string, { hash: string; role: AdminRole }>()
  const user = process.env.ADMIN_USERNAME || "admin"
  const hash = process.env.ADMIN_PASSWORD_SHA256 || ""
  const roleEnv = process.env.ADMIN_ROLE
  if (user && hash) {
    accounts.set(user, {
      hash: hash.toLowerCase(),
      role: isRole(roleEnv) ? roleEnv : "owner"
    })
  }
  for (const part of (process.env.ADMIN_ACCOUNTS || "").split(/[,;]/)) {
    const item = part.trim()
    if (!item) continue
    const [name, h, role] = item.split(":")
    if (!name || !h || !/^[0-9a-fA-F]{64}$/.test(h)) {
      console.warn(
        `[admin-auth] ADMIN_ACCOUNTS entry ignored (need name:sha256:role): ${item.slice(0, 24)}…`
      )
      continue
    }
    accounts.set(name, {
      hash: h.toLowerCase(),
      role: isRole(role) ? role : "viewer"
    })
  }
  return accounts
}

const adminAccounts = parseAccountsConfig()
console.warn(
  adminAccounts.size
    ? `[admin-auth] accounts: ${[...adminAccounts]
        .map(([n, a]) => `${n}(${a.role})`)
        .join(", ")}`
    : "[admin-auth] no accounts configured — logins rejected until ADMIN_PASSWORD_SHA256 or ADMIN_ACCOUNTS is set."
)

const passwordOverrides = new Map<string, string>()

function lookupAccount(
  username: string
): { hash: string; role: AdminRole } | null {
  const base = adminAccounts.get(username)
  if (!base) return null
  const override = passwordOverrides.get(username)
  return { hash: override ?? base.hash, role: base.role }
}

function resolveSessionSecret(): string {
  const fromEnv = process.env.ADMIN_SESSION_SECRET
  if (fromEnv) return fromEnv
  const file = process.env.SESSION_SECRET_FILE || ".admin-session-secret"
  try {
    if (existsSync(file)) {
      const existing = readFileSync(file, "utf8").trim()
      if (existing.length >= 32) return existing
    }
    const fresh = randomBytes(32).toString("hex")
    writeFileSync(file, `${fresh}\n`, { mode: 0o600 })
    console.warn(
      `[admin-auth] generated session secret → ${file}. Delete + restart to rotate.`
    )
    return fresh
  } catch (err) {
    console.warn(
      `[admin-auth] could not persist secret (${err instanceof Error ? err.message : err}) — per-process random.`
    )
    return randomBytes(32).toString("hex")
  }
}

const ADMIN_SESSION_SECRET = resolveSessionSecret()
const KEEPER_SECRET = process.env.KEEPER_SECRET || ""

function signPayload(payloadB64: string): string {
  return createHmac("sha256", ADMIN_SESSION_SECRET)
    .update(payloadB64)
    .digest("hex")
}

function issueSession(c: Context, username: string): void {
  const payload = Buffer.from(
    JSON.stringify({
      u: username,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SEC
    })
  ).toString("base64url")
  setCookie(c, SESSION_COOKIE, `${payload}.${signPayload(payload)}`, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_TTL_SEC
  })
}

export function readSession(
  c: Context
): { username: string; role: AdminRole } | null {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) return null
  const dot = token.indexOf(".")
  if (dot <= 0 || dot === token.length - 1) return null
  const payloadB64 = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  if (!constantTimeEqual(sig, signPayload(payloadB64))) return null
  try {
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString()
    ) as { u?: unknown; exp?: unknown }
    if (
      typeof payload.u !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null
    }
    const account = lookupAccount(payload.u)
    if (!account) return null
    return { username: payload.u, role: account.role }
  } catch {
    return null
  }
}

export function hasKeeperSecret(c: Context): boolean {
  const keeper = c.req.header("X-Keeper-Secret")
  return Boolean(
    KEEPER_SECRET &&
      typeof keeper === "string" &&
      constantTimeEqual(keeper, KEEPER_SECRET)
  )
}

const unauthorized = (c: Context) => c.json({ error: "unauthorized" }, 401)
const forbidden = (c: Context, role: AdminRole, required: AdminRole) =>
  c.json({ error: "forbidden", role, required }, 403)

export async function requireAdmin(c: Context, next: Next) {
  if (!readSession(c)) return unauthorized(c)
  await next()
}

export async function requireOperator(c: Context, next: Next) {
  const session = readSession(c)
  if (!session) return unauthorized(c)
  if (ROLE_RANK[session.role] < ROLE_RANK.operator) {
    return forbidden(c, session.role, "operator")
  }
  await next()
}

/** Operator session OR keeper machine secret. */
export async function requireAdminOrKeeper(c: Context, next: Next) {
  if (hasKeeperSecret(c)) {
    await next()
    return
  }
  const session = readSession(c)
  if (!session) return unauthorized(c)
  if (ROLE_RANK[session.role] < ROLE_RANK.operator) {
    return forbidden(c, session.role, "operator")
  }
  await next()
}

const WRITE_GUARD_PUBLIC = new Set([
  "/admin/auth/login",
  "/admin/auth/logout",
  "/admin/auth/change-password"
])

async function writeGuard(c: Context, next: Next) {
  const method = c.req.method.toUpperCase()
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next()
  }
  if (WRITE_GUARD_PUBLIC.has(c.req.path)) return next()
  if (c.req.path.startsWith("/internal/") && hasKeeperSecret(c)) return next()
  const session = readSession(c)
  if (!session) return unauthorized(c)
  if (ROLE_RANK[session.role] < ROLE_RANK.operator) {
    return forbidden(c, session.role, "operator")
  }
  return next()
}

const LOGIN_MAX_FAILURES = 5
const LOGIN_LOCK_MS = 15 * 60 * 1000
const loginFailures = new Map<string, { count: number; lockedUntil: number }>()

function loginClientKey(c: Context): string {
  const fwd = c.req.header("x-forwarded-for")
  if (fwd) return fwd.split(",")[0]!.trim()
  return c.req.header("x-real-ip") ?? "unknown"
}

/** Mount auth routes + write guards. Call once on the root Hono app. */
export function mountAdminAuth(app: Hono): void {
  app.use("/admin/*", writeGuard)
  app.use("/internal/*", writeGuard)

  app.post("/admin/auth/login", async (c) => {
    const clientKey = loginClientKey(c)
    const entry = loginFailures.get(clientKey)
    const now = Date.now()
    if (entry && entry.lockedUntil > now) {
      const retryAfterSec = Math.ceil((entry.lockedUntil - now) / 1000)
      c.header("Retry-After", String(retryAfterSec))
      return c.json({ error: "too many failed attempts" }, 429)
    }

    const body = await c.req.json().catch(() => null)
    const { username, password } = (body ?? {}) as Record<string, unknown>
    const candidate =
      typeof password === "string"
        ? createHash("sha256").update(password).digest("hex")
        : ""
    const account =
      typeof username === "string" ? lookupAccount(username) : null
    if (
      !account ||
      !account.hash ||
      !constantTimeEqual(candidate, account.hash)
    ) {
      const current = loginFailures.get(clientKey) ?? {
        count: 0,
        lockedUntil: 0
      }
      current.count += 1
      if (current.count >= LOGIN_MAX_FAILURES) {
        current.lockedUntil = Date.now() + LOGIN_LOCK_MS
      }
      loginFailures.set(clientKey, current)
      return unauthorized(c)
    }
    loginFailures.delete(clientKey)
    issueSession(c, username as string)
    return c.json({
      authenticated: true,
      username,
      role: account.role
    })
  })

  app.get("/admin/auth/me", (c) => {
    const session = readSession(c)
    return c.json(
      session
        ? {
            authenticated: true,
            username: session.username,
            role: session.role
          }
        : { authenticated: false }
    )
  })

  app.post("/admin/auth/logout", (c) => {
    deleteCookie(c, SESSION_COOKIE, { path: "/" })
    return c.json({ ok: true })
  })

  app.post("/admin/auth/change-password", requireAdmin, async (c) => {
    const session = readSession(c)!
    const account = lookupAccount(session.username)
    if (!account) return unauthorized(c)
    const body = await c.req.json().catch(() => null)
    const { oldPassword, newPassword } = (body ?? {}) as Record<string, unknown>
    if (
      typeof oldPassword !== "string" ||
      typeof newPassword !== "string" ||
      newPassword.length < 8
    ) {
      return c.json(
        {
          error: "oldPassword and newPassword (min 8 chars) are required"
        },
        400
      )
    }
    const oldCandidate = createHash("sha256").update(oldPassword).digest("hex")
    if (!constantTimeEqual(oldCandidate, account.hash)) {
      return unauthorized(c)
    }
    passwordOverrides.set(
      session.username,
      createHash("sha256").update(newPassword).digest("hex")
    )
    issueSession(c, session.username)
    return c.json({ ok: true })
  })
}

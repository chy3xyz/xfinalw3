/**
 * Admin REST client — same-origin `/api/*` (Vite proxy → indexer).
 * Cookie-session; helpers throw Error(message) on !ok.
 * Auth backend: indexer `/admin/auth/*`.
 */
import type { AdminMe } from "./api.types"

const UNAUTH_EVENT = "xfinalw3:unauthorized"

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: init?.body ? { "content-type": "application/json" } : undefined,
    ...init
  })
  const text = await res.text().catch(() => "")
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(UNAUTH_EVENT))
    }
    let msg = `HTTP ${res.status}`
    try {
      const j = JSON.parse(text) as {
        message?: string
        error?: string
        role?: string
        required?: string
      }
      msg = j.message || j.error || msg
      if (res.status === 403 && j.error === "forbidden") {
        const label: Record<string, string> = {
          viewer: "只读",
          operator: "运营",
          owner: "所有者"
        }
        msg = `权限不足：需要「${label[j.required || ""] || j.required || "运营"}」及以上角色（当前：${label[j.role || ""] || j.role || "未知"}）`
      }
    } catch {
      /* keep status text */
    }
    throw new Error(msg)
  }
  return (text ? JSON.parse(text) : {}) as T
}

export async function adminMe(): Promise<AdminMe> {
  return request<AdminMe>("/api/admin/auth/me")
}

export async function adminLogin(
  username: string,
  password: string
): Promise<AdminMe> {
  return request<AdminMe>("/api/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  })
}

export async function adminLogout(): Promise<void> {
  await request("/api/admin/auth/logout", { method: "POST" })
}

export async function adminChangePassword(p: {
  oldPassword: string
  newPassword: string
}): Promise<void> {
  await request("/api/admin/auth/change-password", {
    method: "POST",
    body: JSON.stringify(p)
  })
}

/** Example protected ping — extend with product admin REST. */
export async function adminPing(): Promise<{ ok: boolean; ts: string }> {
  return request("/api/admin/ping")
}

export { UNAUTH_EVENT }

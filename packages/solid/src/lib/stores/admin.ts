/**
 * Admin session + role gate for UI (server re-checks on every write).
 */
import { createSignal } from "solid-js"
import type { AdminMe, AdminRole } from "../api.types"

const RANK: Record<AdminRole, number> = { viewer: 1, operator: 2, owner: 3 }

const ROLE_LABEL: Record<AdminRole, string> = {
  viewer: "只读",
  operator: "运营",
  owner: "所有者"
}

const [me, setMe] = createSignal<AdminMe | null>(null)

export const adminStore = {
  me,
  setMe,
  role: (): AdminRole => me()?.role ?? "viewer",
  username: () => me()?.username ?? "",
  atLeast: (min: AdminRole) => RANK[me()?.role ?? "viewer"] >= RANK[min],
  canOperate: () => RANK[me()?.role ?? "viewer"] >= RANK.operator,
  isOwner: () => me()?.role === "owner",
  roleLabel: () => ROLE_LABEL[me()?.role ?? "viewer"]
}

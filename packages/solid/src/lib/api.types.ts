/** Shared admin API types (from mmm admin REST surface, product-agnostic). */

export type AdminRole = "viewer" | "operator" | "owner"

export interface AdminMe {
  authenticated: boolean
  username?: string
  role?: AdminRole
}

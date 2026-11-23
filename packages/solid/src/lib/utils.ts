// ============================================================
// Format helpers (shared across pages).
// ============================================================
export function shortAddr(
  a: string | null | undefined,
  head = 6,
  tail = 4
): string {
  if (!a) return ""
  if (a.length <= head + tail) return a
  return a.slice(0, head) + ".." + a.slice(-tail)
}

/** Relative time label (zh). */
export function daysAgo(ts: number | null | undefined): string {
  if (!ts) return "--"
  const diff = Math.floor(Date.now() / 1000) - Number(ts)
  if (diff < 60) return "刚刚"
  if (diff < 3600) return Math.floor(diff / 60) + " 分钟前"
  if (diff < 86400) return Math.floor(diff / 3600) + " 小时前"
  return Math.floor(diff / 86400) + " 天前"
}

/** 拼接 pathname + 当前 search（保留 ?ref= 等邀请参数） */
export function pathWithSearch(
  pathname: string,
  search: string | undefined | null
): string {
  const q = (search || "").trim()
  if (!q || q === "?") return pathname
  return pathname + (q.startsWith("?") ? q : `?${q}`)
}

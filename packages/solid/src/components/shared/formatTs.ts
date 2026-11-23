// ============================================================
// 时间戳格式化 — 集中管理（P2-5）
// 输入为 unix 秒（number | string | bigint），非法/缺省返回 '—'
// ============================================================

export type FormatTsStyle = "datetime" | "date" | "short-date"

export function formatTs(
  v?: number | string | bigint | null,
  opts?: { style?: FormatTsStyle }
): string {
  const n = Number(v ?? 0)
  if (!Number.isFinite(n) || n <= 0) return "—"
  const d = new Date(n * 1000)
  switch (opts?.style) {
    case "date":
      return d.toLocaleDateString()
    case "short-date":
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    default:
      return d.toLocaleString()
  }
}

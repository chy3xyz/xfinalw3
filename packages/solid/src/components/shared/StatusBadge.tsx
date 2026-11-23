export type BadgeTone = "ok" | "info" | "warn" | "primary" | "danger" | "muted"

export const TONE_CLASS: Record<BadgeTone, string> = {
  ok: "bg-emerald-500/15 text-emerald-300",
  info: "bg-sky-500/15 text-sky-300",
  warn: "bg-amber-500/15 text-amber-300",
  primary: "bg-primary/15 text-primary",
  danger: "bg-red-500/15 text-red-300",
  muted: "bg-void-card text-gray-400"
}

export const TONE_PANEL_CLASS: Record<BadgeTone, string> = {
  ok: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
  info: "bg-sky-500/10 border-sky-500/25 text-sky-300",
  warn: "bg-amber-500/10 border-amber-500/25 text-amber-300",
  danger: "bg-red-500/10 border-red-500/25 text-red-300",
  primary: "bg-primary/10 border-primary/25 text-primary",
  muted: "bg-void-card/60 border-void-edge/30 text-gray-400"
}

export function StatusBadge(props: {
  label: string
  tone?: BadgeTone
  class?: string
}) {
  return (
    <span
      class={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${TONE_CLASS[props.tone ?? "muted"]} ${props.class || ""}`}
    >
      {props.label}
    </span>
  )
}

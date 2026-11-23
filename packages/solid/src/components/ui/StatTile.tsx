// ============================================================
// StatTile — 金融数据的小方块：11px 标签 + 粗体数值
// 数值用 .num（Inter + tabular-nums，设计稿口径），靠字号压过标签，不靠颜色。
// tone 只映射既有语义色（emerald / primary / amber），不引入新色。
// ============================================================
import { type JSX, Show } from "solid-js"

export type StatTileTone = "default" | "ok" | "warn" | "primary"

const TONE: Record<
  StatTileTone,
  { edge: string; label: string; value: string }
> = {
  default: {
    edge: "border-void-edge/20",
    label: "text-gray-400",
    value: "text-white"
  },
  ok: {
    edge: "border-void-edge/20",
    label: "text-gray-400",
    value: "text-emerald-300"
  },
  primary: {
    edge: "border-void-edge/20",
    label: "text-gray-400",
    value: "text-primary"
  },
  warn: {
    edge: "border-amber-500/30",
    label: "text-amber-400",
    value: "text-amber-300"
  }
}

export function StatTile(props: {
  label: string
  /** 省略时只渲染标签，由 children 放 Skeleton 等占位 */
  value?: string
  tone?: StatTileTone
  hint?: string
  /** xs = 四宫格里的紧凑档（10px 标签 + 14px 数值，p-2） */
  size?: "xs" | "md" | "lg"
  class?: string
  children?: JSX.Element
}) {
  const tone = () => TONE[props.tone ?? "default"]
  const pad = () => (props.size === "xs" ? "p-2" : "p-3")
  const labelSize = () =>
    props.size === "xs" ? "text-[10px] mb-0.5" : "text-[11px] mb-1"
  const valueSize = () =>
    props.size === "lg"
      ? "text-lg"
      : props.size === "xs"
        ? "text-sm"
        : "text-base"
  return (
    <div
      class={`min-w-0 rounded-xl bg-void-card/40 border ${tone().edge} ${pad()} ${props.class || ""}`}
    >
      <div
        class={`${labelSize()} truncate ${tone().label}`}
        title={props.label}
      >
        {props.label}
      </div>
      <Show when={props.value !== undefined}>
        <div
          class={`num truncate font-bold ${valueSize()} ${tone().value}`}
          title={props.value}
        >
          {props.value}
        </div>
      </Show>
      {props.children}
      <Show when={props.hint !== undefined}>
        <div class="text-[11px] text-gray-400 mt-1 leading-relaxed">
          {props.hint}
        </div>
      </Show>
    </div>
  )
}

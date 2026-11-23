import type { JSX } from "solid-js"
import { splitProps } from "solid-js"

type Variant = "primary" | "ghost" | "outline" | "light"

export type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  full?: boolean
}

const VARIANT: Record<Variant, string> = {
  primary:
    "glow-btn px-4 py-3 text-sm font-bold disabled:opacity-30 disabled:pointer-events-none",
  ghost:
    "px-4 py-3 rounded-xl border border-void-edge/30 text-gray-400 hover:text-primary hover:border-primary/30 transition-colors text-sm disabled:opacity-30",
  outline:
    "px-4 py-3 rounded-xl bg-surface border border-primary/30 text-primary font-bold disabled:opacity-40 active:scale-[0.98] transition-all text-sm",
  // P2-4: admin 浅色主题的次级主操作（原 mng 页裸写 px-4 py-2 bg-primary 的集中化）
  light:
    "px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium transition-opacity disabled:opacity-40 disabled:pointer-events-none"
}

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, [
    "variant",
    "full",
    "class",
    "children"
  ])
  const variant = () => local.variant || "primary"
  return (
    <button
      {...rest}
      class={`${VARIANT[variant()]} ${local.full ? "w-full" : ""} ${local.class || ""}`}
    >
      {local.children}
    </button>
  )
}

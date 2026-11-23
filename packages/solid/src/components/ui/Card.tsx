import type { JSX } from "solid-js"
import { splitProps } from "solid-js"

export type CardProps = JSX.HTMLAttributes<HTMLDivElement> & {
  padded?: boolean
  divide?: boolean
}

export function Card(props: CardProps) {
  const [local, rest] = splitProps(props, [
    "padded",
    "divide",
    "class",
    "children"
  ])
  return (
    <div
      {...rest}
      class={`rounded-2xl bg-surface border border-void-edge/60 overflow-hidden shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] ${
        local.divide
          ? "divide-y divide-void-edge/20 px-4 py-1"
          : local.padded !== false
            ? "p-4"
            : ""
      } ${local.class || ""}`}
    >
      {local.children}
    </div>
  )
}

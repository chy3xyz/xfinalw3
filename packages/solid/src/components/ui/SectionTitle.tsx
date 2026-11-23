import { A } from "@solidjs/router"
import { Show } from "solid-js"

/**
 * 分区标题（uiv2 `.sec`）：15px 标题 + 右侧 12px 灰色链接。
 * 链接的可点高度仍是 44px（min-h-11 配 -my 抵消，不撑高标题行）。
 */
export function SectionTitle(props: {
  title: string
  href?: string
  label?: string
  class?: string
}) {
  return (
    <div class={`sec ${props.class || ""}`}>
      <b>{props.title}</b>
      <Show when={props.href && props.label}>
        <A href={props.href!} class="-my-3 inline-flex min-h-11 items-center">
          {props.label} ›
        </A>
      </Show>
    </div>
  )
}

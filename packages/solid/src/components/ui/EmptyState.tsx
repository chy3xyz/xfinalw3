import { A } from "@solidjs/router"
import { type JSX, Show } from "solid-js"
import { Card } from "./Card"

/** 空态三件套：图标 + 标题 + 说明 + 下一步入口。嵌在已有卡片里时传 `card={false}` 去掉卡片底。 */
export function EmptyState(props: {
  title: string
  desc?: string
  /** 38px 图标块（uiv2 `.ib`）；不传就只留文字，兼容旧调用 */
  icon?: JSX.Element
  actionHref?: string
  actionLabel?: string
  card?: boolean
  class?: string
}) {
  return (
    <Card
      class={`text-center ${props.card === false ? "!border-0 !bg-transparent !p-0" : "!p-6"} ${
        props.class || ""
      }`}
    >
      <Show when={props.icon}>
        <span class="ib o mx-auto mb-2.5">{props.icon}</span>
      </Show>
      <p class="text-sm font-semibold text-gray-200 mb-2">{props.title}</p>
      <Show when={props.desc}>
        <p class="text-xs text-gray-400 leading-relaxed">{props.desc}</p>
      </Show>
      <Show when={props.actionHref && props.actionLabel}>
        {/* 空态里唯一的出口：inline-block 只有 16px 高，是全站最小的可点区域之一。
            min-h-11 = 44px 触控下限，视觉风格（text-xs + primary 文字链）不动。 */}
        <A
          href={props.actionHref!}
          class="mt-4 inline-flex min-h-11 items-center text-xs text-primary"
        >
          {props.actionLabel} →
        </A>
      </Show>
    </Card>
  )
}

import { A } from "@solidjs/router"
import { type JSX, Show } from "solid-js"

type Props = {
  /** 有 href 时整行是链接；没有时是静态行（用 onClick 时自己包按钮） */
  href?: string
  title: string
  desc?: string
  /** 右侧次要信息（余额、状态、条数） */
  value?: string
  /** 左侧 38px 图标块；不传就只留文字 */
  icon?: JSX.Element
  /** 图标块语义色：金（主流程）/ 蓝（匹配）/ 绿（付款）/ 红（异常） */
  tone?: "o" | "b" | "g" | "r"
  onClick?: () => void
  class?: string
}

/**
 * 列表行（uiv2 `.li`）：图标块 + 标题(+说明) + 右侧值 + 箭头。
 * 行高由 12px 上下内边距撑到 ≥ 56px，满足 44px 触控下限。
 */
export function ListRow(props: Props) {
  const body = (
    <>
      <Show when={props.icon}>
        <span class={`ib ${props.tone || ""}`}>{props.icon}</span>
      </Show>
      <span class="tx">
        <b>{props.title}</b>
        <Show when={props.desc}>
          <span>{props.desc}</span>
        </Show>
      </span>
      <Show when={props.value}>
        <span class="val">{props.value}</span>
      </Show>
      <span class="chev" aria-hidden="true">
        ›
      </span>
    </>
  )

  return (
    <Show
      when={props.href}
      fallback={
        <button
          type="button"
          class={`li w-full text-left ${props.class || ""}`}
          onClick={() => props.onClick?.()}
        >
          {body}
        </button>
      }
    >
      <A href={props.href!} class={`li ${props.class || ""}`}>
        {body}
      </A>
    </Show>
  )
}

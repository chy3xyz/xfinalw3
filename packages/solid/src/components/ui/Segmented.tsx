import { For } from "solid-js"

/**
 * 分段控件（uiv2 `.seg`）：容器 #111118，选中块 #1f1f29 + 白字。
 * 三个页面共用（闪兑四个 tab、余额三个动作、列表筛选），不再各写一套描边胶囊。
 * `items[].id` 是字面量联合，`onChange` 仍是原页面的 setter —— 行为完全不变。
 */
export function Segmented<T extends string>(props: {
  items: ReadonlyArray<{ id: T; label: string }>
  value: T
  onChange: (id: T) => void
  class?: string
  ariaLabel?: string
}) {
  return (
    <div
      class={`seg ${props.class || ""}`}
      role="tablist"
      aria-label={props.ariaLabel}
    >
      <For each={props.items}>
        {(item) => (
          <button
            type="button"
            role="tab"
            aria-selected={props.value === item.id}
            onClick={() => props.onChange(item.id)}
          >
            {item.label}
          </button>
        )}
      </For>
    </div>
  )
}

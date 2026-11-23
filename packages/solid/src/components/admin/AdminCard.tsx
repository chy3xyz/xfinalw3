import type { JSX } from "solid-js"

export function AdminCard(props: { class?: string; children: JSX.Element }) {
  return (
    <div
      class={`border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800${props.class ? ` ${props.class}` : ""}`}
    >
      {props.children}
    </div>
  )
}

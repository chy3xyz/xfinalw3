import type { JSX } from "solid-js"

export function MobileList(props: { class?: string; children: JSX.Element }) {
  return (
    <div
      class={`divide-y divide-gray-100 dark:divide-gray-700/50 sm:hidden${props.class ? ` ${props.class}` : ""}`}
    >
      {props.children}
    </div>
  )
}

export function DesktopTable(props: { class?: string; children: JSX.Element }) {
  return (
    <div
      class={`hidden overflow-x-auto sm:block${props.class ? ` ${props.class}` : ""}`}
    >
      {props.children}
    </div>
  )
}

export function MobileRow(props: { children: JSX.Element }) {
  return <div class="space-y-1.5 p-3">{props.children}</div>
}

export function MobileField(props: {
  label: string
  mono?: boolean
  children: JSX.Element
}) {
  return (
    <div class="flex items-baseline justify-between gap-3">
      <span class="flex-shrink-0 text-xs text-gray-500">{props.label}</span>
      <span
        class={`break-all text-right text-xs${props.mono === false ? "" : " font-mono"}`}
      >
        {props.children}
      </span>
    </div>
  )
}

export function MobileBlock(props: { label: string; children: JSX.Element }) {
  return (
    <div>
      <div class="text-xs text-gray-500">{props.label}</div>
      <p class="break-all text-xs">{props.children}</p>
    </div>
  )
}

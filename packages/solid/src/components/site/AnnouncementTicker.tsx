import { For, Show } from "solid-js"

/** Lightweight announcement strip — pass messages from the page. */
export function AnnouncementTicker(props: { items?: string[] }) {
  const items = () => props.items?.filter(Boolean) ?? []
  return (
    <Show when={items().length > 0}>
      <div class="overflow-hidden border-b border-white/10 bg-white/5 py-2 text-xs text-white/70">
        <div class="animate-[marquee_18s_linear_infinite] whitespace-nowrap px-4">
          <For each={items()}>{(msg) => <span class="mx-6">{msg}</span>}</For>
        </div>
      </div>
    </Show>
  )
}

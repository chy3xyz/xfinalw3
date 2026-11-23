import { A } from "@solidjs/router"
import { For, Show } from "solid-js"
import type { FeatureEntry } from "~/lib/config/appContent"
import { useT } from "~/lib/i18n"

export function FeatureGrid(props: {
  items: FeatureEntry[]
  columns?: 2 | 3
}) {
  const tr = useT()
  const cols = () => (props.columns === 3 ? "grid-cols-3" : "grid-cols-2")
  return (
    <div class={`grid gap-2.5 ${cols()}`}>
      <For each={props.items}>
        {(item) => (
          <A
            href={item.href}
            class="group relative rounded-2xl border border-void-edge/40 bg-void-card/50 p-3.5 transition-colors hover:border-primary/40 hover:bg-void-card/80"
            classList={{ "border-primary/35 bg-primary/5": item.hot }}
          >
            <Show when={item.hot}>
              <span class="absolute right-2 top-2 rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                {tr("common.hot")}
              </span>
            </Show>
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-lg text-primary">
              {item.icon}
            </div>
            <p class="mt-2 text-sm font-semibold text-ink-1">
              {tr(item.titleKey)}
            </p>
            <p class="mt-0.5 line-clamp-2 text-[11px] leading-snug text-ink-3">
              {tr(item.descKey)}
            </p>
          </A>
        )}
      </For>
    </div>
  )
}

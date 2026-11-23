import { Title } from "@solidjs/meta"
import { For, Show, createSignal } from "solid-js"
import { FAQ_ITEMS } from "~/lib/config/appContent"
import { useT } from "~/lib/i18n"

export default function FaqPage() {
  const tr = useT()
  const [open, setOpen] = createSignal<string | null>(FAQ_ITEMS[0]?.id ?? null)

  return (
    <>
      <Title>FAQ · {tr("app.name")}</Title>
      <div class="mx-auto max-w-lg space-y-4 px-4 py-5 pb-24">
        <div>
          <h1 class="text-xl font-bold text-ink-1">{tr("faq.title")}</h1>
          <p class="mt-1 text-sm text-ink-2">{tr("faq.lead")}</p>
        </div>

        <ul class="space-y-2">
          <For each={FAQ_ITEMS}>
            {(item) => {
              const isOpen = () => open() === item.id
              return (
                <li class="overflow-hidden rounded-2xl border border-void-edge/40 bg-void-card/40">
                  <button
                    type="button"
                    class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-semibold text-ink-1"
                    aria-expanded={isOpen()}
                    onClick={() =>
                      setOpen((cur) => (cur === item.id ? null : item.id))
                    }
                  >
                    <span>{tr(item.qKey)}</span>
                    <span class="text-ink-3">{isOpen() ? "−" : "+"}</span>
                  </button>
                  <Show when={isOpen()}>
                    <p class="border-t border-void-edge/30 px-4 py-3 text-sm leading-relaxed text-ink-2">
                      {tr(item.aKey)}
                    </p>
                  </Show>
                </li>
              )
            }}
          </For>
        </ul>
      </div>
    </>
  )
}

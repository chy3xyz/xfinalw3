import { Title } from "@solidjs/meta"
import { A } from "@solidjs/router"
import { For } from "solid-js"
import { ConnectGate } from "~/components/shared/ConnectGate"
import { StubBanner } from "~/components/site/StubBanner"
import { Button } from "~/components/ui/Button"
import { Card } from "~/components/ui/Card"
import { SectionTitle } from "~/components/ui/SectionTitle"
import { useT } from "~/lib/i18n"

const PANELS = [
  {
    href: "/swap",
    titleKey: "trade.panel.swap",
    descKey: "trade.panel.swapDesc"
  },
  {
    href: "/assets",
    titleKey: "trade.panel.assets",
    descKey: "trade.panel.assetsDesc"
  },
  {
    href: "/me",
    titleKey: "trade.panel.orders",
    descKey: "trade.panel.ordersDesc"
  }
] as const

export default function TradePage() {
  const tr = useT()
  return (
    <>
      <Title>
        {tr("nav.trade")} · {tr("app.name")}
      </Title>
      <div class="mx-auto max-w-lg space-y-4 px-4 py-5 pb-24">
        <div>
          <h1 class="text-xl font-bold text-ink-1">{tr("trade.title")}</h1>
          <p class="mt-1 text-sm text-ink-2">{tr("trade.lead")}</p>
        </div>
        <StubBanner />
        <ConnectGate />

        <Card class="space-y-3 p-4">
          <SectionTitle title={tr("trade.book")} />
          <div class="grid grid-cols-2 gap-2">
            <Button type="button" class="!py-3" disabled>
              {tr("trade.buy")}
            </Button>
            <Button type="button" variant="outline" class="!py-3" disabled>
              {tr("trade.sell")}
            </Button>
          </div>
          <p class="text-xs text-ink-3">{tr("trade.bookHint")}</p>
        </Card>

        <section class="space-y-2">
          <SectionTitle title={tr("trade.more")} />
          <For each={[...PANELS]}>
            {(p) => (
              <A
                href={p.href}
                class="flex items-center justify-between rounded-2xl border border-void-edge/40 bg-void-card/50 px-4 py-3 transition-colors hover:border-primary/35"
              >
                <div>
                  <p class="text-sm font-semibold text-ink-1">
                    {tr(p.titleKey)}
                  </p>
                  <p class="text-xs text-ink-3">{tr(p.descKey)}</p>
                </div>
                <span class="text-ink-3">›</span>
              </A>
            )}
          </For>
        </section>
      </div>
    </>
  )
}

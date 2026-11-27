import { Title } from "@solidjs/meta"
import { A } from "@solidjs/router"
import { For, Show } from "solid-js"
import { ConnectGate } from "~/components/shared/ConnectGate"
import { AnnouncementTicker } from "~/components/site/AnnouncementTicker"
import { FeatureGrid } from "~/components/site/FeatureGrid"
import { HomeHero } from "~/components/site/HomeHero"
import { InviteCard } from "~/components/site/InviteCard"
import { InviteLandingBanner } from "~/components/site/InviteLandingBanner"
import { Button } from "~/components/ui/Button"
import { Card } from "~/components/ui/Card"
import { SectionTitle } from "~/components/ui/SectionTitle"
import { StatTile } from "~/components/ui/StatTile"
import { ANNOUNCEMENTS, HOME_FEATURES } from "~/lib/config/appContent"
import { useT } from "~/lib/i18n"
import {
  useScaffoldEventHistory,
  useScaffoldReadContract,
  useScaffoldWriteContract
} from "~/lib/scaffold"
import { walletStore } from "~/lib/stores/wallet"
import { shortAddr } from "~/lib/utils"
import { connectWalletSafe } from "~/lib/web3/wallet"

export default function HomePage() {
  const tr = useT()
  const tickerItems = () => ANNOUNCEMENTS.map((a) => tr(a.textKey))

  const count = useScaffoldReadContract<bigint>({
    contractName: "Counter",
    functionName: "getCount",
    watch: true,
    enabled: () => Boolean(walletStore.walletAddress())
  })
  const writer = useScaffoldWriteContract({ contractName: "Counter" })
  const events = useScaffoldEventHistory({
    contractName: "Counter",
    eventName: "CountUpdated",
    blocksBack: 5_000,
    watch: true,
    enabled: () => Boolean(walletStore.walletAddress())
  })

  return (
    <>
      <Title>{tr("app.name")}</Title>
      <AnnouncementTicker items={tickerItems()} />

      <div class="mx-auto max-w-lg space-y-5 px-4 py-5 pb-24">
        <HomeHero
          primaryHref={walletStore.walletAddress() ? "/trade" : undefined}
          onPrimary={() => void connectWalletSafe()}
        />

        <InviteLandingBanner />

        <section>
          <SectionTitle
            title={tr("home.entries")}
            href="/me"
            label={tr("nav.me")}
          />
          <FeatureGrid items={HOME_FEATURES} />
        </section>

        <div id="invite-panel" class="scroll-mt-16">
          <InviteCard />
        </div>

        <section>
          <SectionTitle title={tr("home.snapshot")} />
          <div class="grid grid-cols-3 gap-2">
            <StatTile
              size="xs"
              label={tr("home.stat.network")}
              value={String(walletStore.currentChainId() || "—")}
              tone="primary"
            />
            <StatTile
              size="xs"
              label={tr("home.stat.wallet")}
              value={
                walletStore.walletAddress()
                  ? shortAddr(walletStore.walletAddress())
                  : tr("home.stat.disconnected")
              }
            />
            <StatTile
              size="xs"
              label={tr("home.stat.announcements")}
              value={String(ANNOUNCEMENTS.length)}
              tone="ok"
            />
          </div>
        </section>

        <ConnectGate />

        <Show when={walletStore.walletAddress()}>
          <Card class="space-y-3 p-4">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-semibold text-white">
                {tr("home.devDemo")}
              </h2>
              <A href="/debug" class="text-xs text-primary">
                {tr("nav.debug")} ›
              </A>
            </div>
            <p class="font-mono text-2xl text-white">
              {count.data()?.toString() ?? "—"}
            </p>
            <Button
              type="button"
              class="!py-2.5"
              disabled={writer.isMining()}
              onClick={() =>
                void writer.writeContractAsync({ functionName: "increment" })
              }
            >
              {writer.isMining() ? "…" : tr("home.increment")}
            </Button>
            <Show when={count.error()}>
              <p class="text-xs text-amber-300">{tr("home.counterHint")}</p>
            </Show>
            <Show when={(events.data() ?? []).length > 0}>
              <div class="border-t border-void-edge/20 pt-2">
                <p class="mb-1 text-[11px] uppercase tracking-wide text-ink-3">
                  CountUpdated
                </p>
                <ul class="max-h-28 space-y-1 overflow-y-auto font-mono text-[11px] text-ink-2">
                  <For each={(events.data() ?? []).slice(-5).reverse()}>
                    {(ev) => (
                      <li>
                        #{ev.blockNumber?.toString() ?? "?"} →{" "}
                        {String(ev.args?.newCount ?? "—")}
                      </li>
                    )}
                  </For>
                </ul>
              </div>
            </Show>
          </Card>
        </Show>

        <section class="space-y-2">
          <SectionTitle title={tr("home.notices")} href="/faq" label="FAQ" />
          <ul class="space-y-2">
            <For each={ANNOUNCEMENTS}>
              {(a) => (
                <li>
                  <A
                    href={a.href || "/faq"}
                    class="block rounded-xl border border-void-edge/30 bg-void-card/40 px-3 py-2.5 text-sm text-ink-2 transition-colors hover:border-primary/30 hover:text-ink-1"
                  >
                    {tr(a.textKey)}
                  </A>
                </li>
              )}
            </For>
          </ul>
        </section>
      </div>
    </>
  )
}

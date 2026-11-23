import { Title } from "@solidjs/meta"
import { A } from "@solidjs/router"
import { For, Show, createSignal } from "solid-js"
import { ConnectGate } from "~/components/shared/ConnectGate"
import { TONE_PANEL_CLASS } from "~/components/shared/StatusBadge"
import { FeatureGrid } from "~/components/site/FeatureGrid"
import { InviteCard } from "~/components/site/InviteCard"
import { InviteLandingBanner } from "~/components/site/InviteLandingBanner"
import { Card } from "~/components/ui/Card"
import { SectionTitle } from "~/components/ui/SectionTitle"
import { StatTile } from "~/components/ui/StatTile"
import { ME_LINKS } from "~/lib/config/appContent"
import { useT } from "~/lib/i18n"
import { copyText, notify } from "~/lib/stores/notify"
import { walletStore } from "~/lib/stores/wallet"
import { shortAddr } from "~/lib/utils"

export default function MePage() {
  const tr = useT()
  const addr = () => walletStore.walletAddress()
  const [addrCopied, setAddrCopied] = createSignal(false)

  async function copyAddr() {
    const a = addr()
    if (!a) return
    const ok = await copyText(a)
    if (!ok) return
    setAddrCopied(true)
    window.setTimeout(() => setAddrCopied(false), 1500)
    notify.success(tr("me.copied"))
  }

  return (
    <>
      <Title>
        {tr("nav.me")} · {tr("app.name")}
      </Title>
      <div class="mx-auto max-w-lg space-y-4 px-4 py-5 pb-24">
        <div class="reveal-in" style={{ "--i": 0 } as never}>
          <h1 class="text-xl font-extrabold tracking-tight text-ink-1">
            {tr("me.title")}
          </h1>
          <p class="mt-1 text-sm text-ink-2">{tr("me.lead")}</p>
        </div>

        <InviteLandingBanner />
        <ConnectGate />

        <Show when={addr()}>
          <Card
            padded={false}
            class="reveal-in space-y-3 p-4"
            style={{ "--i": 1 } as never}
          >
            <div class="flex items-center gap-2">
              <span class="min-w-0 flex-1 truncate font-mono text-sm text-ink-1">
                {shortAddr(addr())}
              </span>
              <button
                type="button"
                class="-mr-2 inline-flex min-h-11 shrink-0 items-center px-2 text-xs text-primary hover:underline motion-safe:transition motion-safe:active:scale-[0.98]"
                onClick={() => void copyAddr()}
              >
                {addrCopied() ? tr("common.copied") : tr("me.copy")}
              </button>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <StatTile
                size="xs"
                label={tr("me.chain")}
                value={String(walletStore.currentChainId() || "—")}
                tone="primary"
              />
              <StatTile
                size="xs"
                label={tr("me.status")}
                value={tr("me.connected")}
                tone="ok"
              />
            </div>
            <div
              class={`rounded-xl border px-3 py-2 text-[11px] leading-relaxed ${TONE_PANEL_CLASS.muted}`}
            >
              {tr("invite.hint")}
            </div>
          </Card>
        </Show>

        <div id="invite-panel" class="scroll-mt-16">
          <InviteCard />
        </div>

        <section>
          <SectionTitle title={tr("me.shortcuts")} />
          <FeatureGrid items={ME_LINKS} />
        </section>

        <section class="space-y-2">
          <SectionTitle title={tr("me.more")} />
          <For
            each={[
              { href: "/faq", label: tr("nav.faq") },
              { href: "/debug", label: tr("nav.debug") },
              { href: "/mng", label: tr("nav.admin") }
            ]}
          >
            {(row) => (
              <A
                href={row.href}
                class="flex items-center justify-between rounded-xl border border-void-edge/30 px-4 py-3 text-sm text-ink-2 hover:border-primary/30 hover:text-ink-1"
              >
                <span>{row.label}</span>
                <span>›</span>
              </A>
            )}
          </For>
        </section>
      </div>
    </>
  )
}

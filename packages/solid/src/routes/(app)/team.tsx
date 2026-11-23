import { Title } from "@solidjs/meta"
import { useLocation } from "@solidjs/router"
import { Show, createMemo } from "solid-js"
import { ConnectGate } from "~/components/shared/ConnectGate"
import { TONE_PANEL_CLASS } from "~/components/shared/StatusBadge"
import { InviteCard } from "~/components/site/InviteCard"
import { InviteLandingBanner } from "~/components/site/InviteLandingBanner"
import { StubBanner } from "~/components/site/StubBanner"
import { Card } from "~/components/ui/Card"
import { EmptyState } from "~/components/ui/EmptyState"
import { SectionTitle } from "~/components/ui/SectionTitle"
import { StatTile } from "~/components/ui/StatTile"
import { useT } from "~/lib/i18n"
import { walletStore } from "~/lib/stores/wallet"
import { isValidInviteCodeFormat, resolveInviteCode } from "~/lib/web3/invite"

export default function TeamPage() {
  const tr = useT()
  const loc = useLocation()
  const pending = createMemo(() => {
    const q = new URLSearchParams(loc.search)
    return resolveInviteCode(q.get("ref"))
  })

  return (
    <>
      <Title>
        {tr("nav.team")} · {tr("app.name")}
      </Title>
      <div class="mx-auto max-w-lg space-y-4 px-4 py-5 pb-24">
        <div class="reveal-in" style={{ "--i": 0 } as never}>
          <h1 class="text-xl font-extrabold tracking-tight text-ink-1">
            {tr("team.title")}
          </h1>
          <p class="mt-1 text-sm text-ink-2">{tr("team.lead")}</p>
        </div>

        <InviteLandingBanner />
        <StubBanner />
        <ConnectGate />

        <Show when={isValidInviteCodeFormat(pending())}>
          <div
            class={`rounded-xl border px-3 py-2 text-xs leading-relaxed ${TONE_PANEL_CLASS.info}`}
          >
            {tr("invite.pendingLabel")}:{" "}
            <span class="font-mono font-bold tracking-widest">{pending()}</span>
          </div>
        </Show>

        <div
          class="reveal-in grid grid-cols-3 gap-2"
          style={{ "--i": 1 } as never}
        >
          <StatTile size="xs" label={tr("team.direct")} value="0" />
          <StatTile
            size="xs"
            label={tr("team.team")}
            value="0"
            tone="primary"
          />
          <StatTile size="xs" label={tr("team.volume")} value="—" />
        </div>

        <div id="invite-panel" class="scroll-mt-16">
          <InviteCard />
        </div>

        <Card class="reveal-in p-4" style={{ "--i": 2 } as never}>
          <SectionTitle title={tr("team.members")} />
          <Show
            when={walletStore.walletAddress()}
            fallback={<EmptyState title={tr("team.needWallet")} />}
          >
            <EmptyState
              title={tr("team.emptyTitle")}
              desc={tr("team.emptyDesc")}
              card={false}
            />
          </Show>
        </Card>
      </div>
    </>
  )
}

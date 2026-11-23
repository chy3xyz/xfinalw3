import { useLocation } from "@solidjs/router"
import { Show, createMemo } from "solid-js"
import { TONE_PANEL_CLASS } from "~/components/shared/StatusBadge"
import { Button } from "~/components/ui/Button"
import { Card } from "~/components/ui/Card"
import { useT } from "~/lib/i18n"
import { walletStore } from "~/lib/stores/wallet"
import {
  inviteCodeFromAddress,
  isValidInviteCodeFormat,
  resolveInviteCode
} from "~/lib/web3/invite"

/**
 * Shown when a friend lands via `?ref=` (or pending storage) and has not
 * connected / is not the inviter themselves. Mirrors MMM /m/me landing card.
 */
export function InviteLandingBanner() {
  const tr = useT()
  const loc = useLocation()

  const pending = createMemo(() => {
    const q = new URLSearchParams(loc.search)
    return resolveInviteCode(q.get("ref"))
  })

  const show = createMemo(() => {
    const code = pending()
    if (!isValidInviteCodeFormat(code)) return false
    const mine = inviteCodeFromAddress(walletStore.walletAddress())
    if (mine && mine === code) return false
    return true
  })

  function scrollToInvite() {
    const el = document.getElementById("invite-panel")
    el?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <Show when={show()}>
      <Card
        padded={false}
        class={`reveal-in border p-5 ${TONE_PANEL_CLASS.primary}`}
        style={{ "--i": 0 } as never}
      >
        <div class="text-sm font-semibold text-ink-1">
          {tr("invite.landingTitle")}
        </div>
        <p class="mt-1 text-xs leading-relaxed text-ink-2">
          {tr("invite.landingDesc", { code: pending() })}
        </p>
        <Show
          when={walletStore.walletAddress()}
          fallback={
            <p class="mt-3 text-xs text-ink-3">{tr("invite.landingConnect")}</p>
          }
        >
          <Button
            type="button"
            full
            class="mt-3 !py-2.5"
            onClick={() => scrollToInvite()}
          >
            {tr("invite.landingCta")}
          </Button>
        </Show>
      </Card>
    </Show>
  )
}

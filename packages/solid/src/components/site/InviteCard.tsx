import { Show, createMemo, createSignal } from "solid-js"
import { TONE_PANEL_CLASS } from "~/components/shared/StatusBadge"
import { Button } from "~/components/ui/Button"
import { Card } from "~/components/ui/Card"
import { SectionTitle } from "~/components/ui/SectionTitle"
import { useT } from "~/lib/i18n"
import { copyText, notify } from "~/lib/stores/notify"
import { walletStore } from "~/lib/stores/wallet"
import {
  buildInviteLink,
  inviteCodeFromAddress,
  isValidInviteCodeFormat
} from "~/lib/web3/invite"

function selectInviteInput(el: HTMLInputElement) {
  try {
    el.focus()
    el.select()
  } catch {
    /* ignore */
  }
}

/**
 * MMM-style invite card: code row + monospace link field + copy / share.
 * Scaffold derives code from wallet until on-chain registry exists.
 */
export function InviteCard(props: { showTitle?: boolean; class?: string }) {
  const tr = useT()
  const [copied, setCopied] = createSignal(false)

  const code = createMemo(() =>
    inviteCodeFromAddress(walletStore.walletAddress())
  )
  const link = createMemo(() => buildInviteLink(code()))
  const ready = createMemo(() => isValidInviteCodeFormat(code()))

  async function copy(text: string, message?: string) {
    if (!text) return
    const ok = await copyText(text)
    if (!ok) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
    notify.success(message ?? tr("common.copied"))
  }

  async function share() {
    const url = link()
    if (!url) return
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: tr("app.name"),
          text: tr("invite.shareText"),
          url
        })
        return
      } catch {
        /* fall through to clipboard */
      }
    }
    void copy(url, tr("invite.shareCopiedOnly"))
  }

  return (
    <Show when={walletStore.walletAddress()}>
      <section class={props.class}>
        <Show when={props.showTitle !== false}>
          <SectionTitle title={tr("invite.title")} />
        </Show>
        <Card
          padded={false}
          class="reveal-in space-y-0 p-5"
          style={{ "--i": 0 } as never}
        >
          <Show
            when={ready()}
            fallback={
              <p class="text-sm leading-relaxed text-ink-2">
                {tr("invite.needWallet")}
              </p>
            }
          >
            <div class="mb-3 flex items-center justify-between gap-2">
              <span class="text-xs text-ink-3">{tr("invite.codeLabel")}</span>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  class={`flex min-h-11 items-center gap-2 rounded-lg border px-2.5 text-left motion-safe:transition motion-safe:active:scale-[0.99] ${TONE_PANEL_CLASS.primary}`}
                  onClick={() => void copy(code())}
                >
                  <span class="font-mono text-sm font-bold tracking-[0.14em] text-white tabular-nums">
                    {code()}
                  </span>
                  <span class="shrink-0 text-xs">
                    {copied() ? tr("common.copied") : tr("common.copy")}
                  </span>
                </button>
              </div>
            </div>

            <input
              type="text"
              readonly
              value={link()}
              aria-label={tr("invite.copyLink")}
              class="w-full select-all rounded-xl border border-void-edge/30 bg-void-card/60 px-3 py-2.5 font-mono text-base text-ink-2 focus:border-primary"
              onFocus={(e) => selectInviteInput(e.currentTarget)}
              onClick={(e) => selectInviteInput(e.currentTarget)}
              onTouchEnd={(e) => selectInviteInput(e.currentTarget)}
            />

            <div class="mt-3 flex gap-2">
              <Button
                type="button"
                variant="ghost"
                class="flex-1 !py-2.5 !text-xs"
                onClick={() => void copy(link())}
              >
                {copied() ? tr("common.copied") : tr("invite.copyLink")}
              </Button>
              <Button
                type="button"
                class="flex-1 !py-2.5 !text-xs"
                onClick={() => void share()}
              >
                {tr("common.share")}
              </Button>
            </div>

            <p class="mt-3 text-xs leading-relaxed text-ink-3">
              {tr("invite.hint")}
            </p>
          </Show>
        </Card>
      </section>
    </Show>
  )
}

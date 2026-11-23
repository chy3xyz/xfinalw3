import { Title } from "@solidjs/meta"
import { createSignal } from "solid-js"
import { ConnectGate } from "~/components/shared/ConnectGate"
import { StubBanner } from "~/components/site/StubBanner"
import { Button } from "~/components/ui/Button"
import { Card } from "~/components/ui/Card"
import { useT } from "~/lib/i18n"
import { notify } from "~/lib/stores/notify"

export default function SwapPage() {
  const tr = useT()
  const [fromAmt, setFromAmt] = createSignal("")
  const [toAmt, setToAmt] = createSignal("")

  function quote() {
    const n = Number(fromAmt())
    if (!Number.isFinite(n) || n <= 0) {
      setToAmt("")
      return
    }
    // Scaffold quote: 1:1 placeholder — replace with vault/AMM hook
    setToAmt((n * 0.998).toFixed(6))
  }

  return (
    <>
      <Title>
        {tr("nav.swap")} · {tr("app.name")}
      </Title>
      <div class="mx-auto max-w-lg space-y-4 px-4 py-5 pb-24">
        <div>
          <h1 class="text-xl font-bold text-ink-1">{tr("swap.title")}</h1>
          <p class="mt-1 text-sm text-ink-2">{tr("swap.lead")}</p>
        </div>
        <StubBanner />
        <ConnectGate />

        <Card class="space-y-3 p-4">
          <label class="block text-xs text-ink-3">{tr("swap.from")}</label>
          <input
            class="w-full rounded-xl border border-void-edge/40 bg-void/60 px-3 py-3 font-mono text-sm text-ink-1 outline-none focus:border-primary/50"
            inputmode="decimal"
            placeholder="0.0"
            value={fromAmt()}
            onInput={(e) => {
              setFromAmt(e.currentTarget.value)
              quote()
            }}
          />
          <div class="flex justify-center text-ink-3">↓</div>
          <label class="block text-xs text-ink-3">{tr("swap.to")}</label>
          <input
            class="w-full rounded-xl border border-void-edge/40 bg-void/40 px-3 py-3 font-mono text-sm text-ink-2 outline-none"
            readonly
            placeholder="0.0"
            value={toAmt()}
          />
          <p class="text-[11px] text-ink-3">{tr("swap.rateHint")}</p>
          <Button
            type="button"
            full
            onClick={() => notify.info(tr("common.scaffoldStub"))}
          >
            {tr("swap.submit")}
          </Button>
        </Card>
      </div>
    </>
  )
}

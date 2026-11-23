import { Show } from "solid-js"
import { Button } from "~/components/ui/Button"
import { useT } from "~/lib/i18n"
import { EXPECTED_CHAIN_ID } from "~/lib/web3/config"
import { ensureTargetChain, walletStore } from "~/lib/web3/wallet"

export function ChainBanner() {
  const tr = useT()
  return (
    <Show
      when={
        walletStore.walletAddress() &&
        walletStore.currentChainId() !== EXPECTED_CHAIN_ID
      }
    >
      <div class="fixed inset-x-0 top-14 z-30 border-b border-amber-500/30 bg-amber-500/15 px-4 py-2 text-center text-sm text-amber-100">
        {tr("wallet.wrongNetwork")}{" "}
        <Button
          type="button"
          class="ml-2 px-2 py-0.5 text-xs"
          onClick={() => void ensureTargetChain()}
        >
          Switch
        </Button>
      </div>
    </Show>
  )
}

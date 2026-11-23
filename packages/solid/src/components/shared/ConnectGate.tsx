import { type JSX, Show } from "solid-js"
import { Button } from "~/components/ui/Button"
import { Card } from "~/components/ui/Card"
import { useT } from "~/lib/i18n"
import { walletStore } from "~/lib/stores/wallet"
import { connectWalletSafe } from "~/lib/web3/wallet"

export function ConnectGate(props: { icon?: string; children?: JSX.Element }) {
  const tr = useT()
  return (
    <Show when={!walletStore.walletAddress()}>
      <Card class="p-8 text-center">
        <div class="mb-3 text-4xl">{props.icon ?? "👛"}</div>
        <p class="mb-4 text-sm text-gray-400">
          {tr("home.connectWalletFirst")}
        </p>
        <Button type="button" onClick={() => connectWalletSafe()} class="px-8">
          {tr("wallet.connect")}
        </Button>
        {props.children}
      </Card>
    </Show>
  )
}

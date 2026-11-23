import { Title } from "@solidjs/meta"
import { For, Show } from "solid-js"
import { Card } from "~/components/ui/Card"
import { contractsData } from "~/lib/contracts"
import { walletStore } from "~/lib/stores/wallet"
import { EXPECTED_CHAIN_ID } from "~/lib/web3/config"

export default function DebugPage() {
  const chainId = () => walletStore.currentChainId() || EXPECTED_CHAIN_ID
  const chainContracts = () =>
    (contractsData as Record<number, Record<string, { address: string }>>)[
      chainId()
    ] ?? {}

  return (
    <>
      <Title>Debug · Xfinalw3</Title>
      <div class="mx-auto max-w-lg space-y-4 px-4 py-6 pb-24">
        <h1 class="text-xl font-semibold text-white">Debug contracts</h1>
        <Card class="space-y-2 p-4 text-sm text-white/70">
          <p>
            Chain:{" "}
            <span class="font-mono text-white">
              {walletStore.currentChainName()} ({chainId()})
            </span>
          </p>
          <p>
            Account:{" "}
            <span class="font-mono text-white">
              {walletStore.walletAddress() ?? "—"}
            </span>
          </p>
        </Card>

        <Show
          when={Object.keys(chainContracts()).length > 0}
          fallback={
            <Card class="p-4 text-sm text-amber-200">
              No deployed contracts for chain {chainId()}. Run `bun
              deploy:local`.
            </Card>
          }
        >
          <For each={Object.entries(chainContracts())}>
            {([name, c]) => (
              <Card class="space-y-1 p-4">
                <h2 class="font-medium text-white">{name}</h2>
                <p class="break-all font-mono text-xs text-white/60">
                  {c.address}
                </p>
              </Card>
            )}
          </For>
        </Show>
      </div>
    </>
  )
}

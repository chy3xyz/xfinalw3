import { Show, createSignal, onCleanup } from "solid-js"
import { useT } from "~/lib/i18n"
import { notify } from "~/lib/stores/notify"
import { walletStore } from "~/lib/stores/wallet"
import { shortAddr } from "~/lib/utils"
import { EXPECTED_CHAIN_ID } from "~/lib/web3/config"
import {
  classifyError,
  connectWalletSafe,
  disconnectWallet,
  switchChain
} from "~/lib/web3/wallet"

/** Admin shell wallet chip — connect / switch / disconnect for on-chain ops. */
export function AdminWallet() {
  const tr = useT()
  const [open, setOpen] = createSignal(false)
  const [busy, setBusy] = createSignal(false)

  const addr = () => walletStore.walletAddress()
  const onChain = () => walletStore.currentChainId() === EXPECTED_CHAIN_ID

  function close() {
    setOpen(false)
  }
  function onDocClick(e: MouseEvent) {
    const el = e.target as HTMLElement | null
    if (el && !el.closest("[data-admin-wallet]")) close()
  }
  document.addEventListener("pointerdown", onDocClick)
  onCleanup(() => document.removeEventListener("pointerdown", onDocClick))

  async function handleConnect() {
    if (busy()) return
    setBusy(true)
    try {
      const got = await connectWalletSafe()
      if (got) notify.success(tr("wallet.connect"))
    } catch (e) {
      notify.error(classifyError(e) || String(e))
    } finally {
      setBusy(false)
      close()
    }
  }

  async function handleSwitch() {
    try {
      await switchChain("foundry")
    } catch (e) {
      notify.error(classifyError(e) || String(e))
    }
    close()
  }

  async function handleDisconnect() {
    await disconnectWallet()
    close()
  }

  return (
    <div class="relative" data-admin-wallet>
      <Show
        when={addr()}
        fallback={
          <button
            type="button"
            disabled={busy()}
            onClick={handleConnect}
            class="rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            {tr("wallet.connect")}
          </button>
        }
      >
        <button
          type="button"
          onClick={() => setOpen(!open())}
          class="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <span
            class="h-2 w-2 rounded-full"
            classList={{
              "bg-emerald-500": onChain(),
              "bg-amber-500": !onChain()
            }}
          />
          <span class="font-mono">{shortAddr(addr()!)}</span>
        </button>
      </Show>
      <Show when={open() && addr()}>
        <div class="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800">
          <Show when={!onChain()}>
            <button
              type="button"
              onClick={handleSwitch}
              class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700/50"
            >
              {tr("wallet.wrongNetwork")}
            </button>
          </Show>
          <button
            type="button"
            onClick={handleDisconnect}
            class="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700/50"
          >
            {tr("wallet.disconnect")}
          </button>
        </div>
      </Show>
    </div>
  )
}

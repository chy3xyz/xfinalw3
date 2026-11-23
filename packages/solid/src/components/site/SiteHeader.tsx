import { A, useLocation } from "@solidjs/router"
import { For, Show, createMemo, createSignal, onCleanup } from "solid-js"
import { BrandLogo } from "~/components/site/BrandLogo"
import { Button } from "~/components/ui/Button"
import {
  type Locale,
  SUPPORTED_LOCALES,
  i18n,
  localeFlag,
  useT
} from "~/lib/i18n"
import { shortAddr } from "~/lib/utils"
import { EXPECTED_CHAIN_ID, walletConnectEnabled } from "~/lib/web3/config"
import {
  connectWalletSafe,
  disconnectWallet,
  switchChain,
  walletStore
} from "~/lib/web3/wallet"
import { connectWalletWC } from "~/lib/web3/wallet"

type Menu = "lang" | "chain" | "wallet" | "connect" | null

export function SiteHeader() {
  const tr = useT()
  const location = useLocation()
  const user = () => walletStore.walletAddress()
  const [openMenu, setOpenMenu] = createSignal<Menu>(null)
  let rootEl: HTMLDivElement | undefined

  const onExpectedChain = createMemo(
    () => walletStore.currentChainId() === EXPECTED_CHAIN_ID
  )

  function closeAll() {
    setOpenMenu(null)
  }

  function toggle(menu: Exclude<Menu, null>) {
    setOpenMenu((cur) => (cur === menu ? null : menu))
  }

  const onDocClick = (e: MouseEvent) => {
    if (rootEl && !rootEl.contains(e.target as Node)) closeAll()
  }
  if (typeof document !== "undefined") {
    document.addEventListener("click", onDocClick)
    onCleanup(() => document.removeEventListener("click", onDocClick))
  }

  return (
    <header
      ref={rootEl}
      class="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur"
    >
      <div class="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
        <div class="flex items-center gap-4">
          <BrandLogo />
          <nav class="hidden items-center gap-3 text-sm text-white/70 sm:flex">
            <A
              href="/"
              class="hover:text-white"
              classList={{ "text-white": location.pathname === "/" }}
            >
              {tr("nav.home")}
            </A>
            <A
              href="/trade"
              class="hover:text-white"
              classList={{
                "text-white": location.pathname.startsWith("/trade")
              }}
            >
              {tr("nav.trade")}
            </A>
            <A
              href="/me"
              class="hover:text-white"
              classList={{
                "text-white":
                  location.pathname.startsWith("/me") ||
                  location.pathname.startsWith("/team") ||
                  location.pathname.startsWith("/assets")
              }}
            >
              {tr("nav.me")}
            </A>
            <A
              href="/mng"
              class="hover:text-white"
              classList={{ "text-white": location.pathname.startsWith("/mng") }}
            >
              {tr("nav.admin")}
            </A>
          </nav>
        </div>

        <div class="relative flex items-center gap-2">
          <button
            type="button"
            class="rounded-lg px-2 py-1 text-sm text-white/80 hover:bg-white/10"
            onClick={() => toggle("lang")}
          >
            {localeFlag(i18n.locale())}
          </button>
          <Show when={openMenu() === "lang"}>
            <div class="absolute right-24 top-10 z-50 min-w-[8rem] rounded-xl border border-white/10 bg-[#12121a] p-1 shadow-xl">
              <For each={[...SUPPORTED_LOCALES]}>
                {(loc) => (
                  <button
                    type="button"
                    class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10"
                    onClick={() => {
                      i18n.setLocale(loc as Locale)
                      closeAll()
                    }}
                  >
                    {localeFlag(loc as Locale)} {loc}
                  </button>
                )}
              </For>
            </div>
          </Show>

          <Show
            when={user()}
            fallback={
              <div class="relative">
                <Button
                  type="button"
                  class="px-3 py-1.5 text-sm"
                  onClick={() => toggle("connect")}
                >
                  {tr("wallet.connect")}
                </Button>
                <Show when={openMenu() === "connect"}>
                  <div class="absolute right-0 top-10 z-50 min-w-[12rem] rounded-xl border border-white/10 bg-[#12121a] p-1 shadow-xl">
                    <button
                      type="button"
                      class="w-full rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10"
                      onClick={async () => {
                        closeAll()
                        await connectWalletSafe()
                      }}
                    >
                      Browser wallet
                    </button>
                    <Show when={walletConnectEnabled()}>
                      <button
                        type="button"
                        class="w-full rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10"
                        onClick={async () => {
                          closeAll()
                          try {
                            await connectWalletWC()
                          } catch {
                            /* toast via classify in connectWalletSafe path */
                          }
                        }}
                      >
                        WalletConnect
                      </button>
                    </Show>
                  </div>
                </Show>
              </div>
            }
          >
            <button
              type="button"
              class="rounded-lg px-2 py-1 text-xs"
              classList={{
                "bg-emerald-500/20 text-emerald-300": onExpectedChain(),
                "bg-amber-500/20 text-amber-300": !onExpectedChain()
              }}
              onClick={() => toggle("chain")}
            >
              {walletStore.currentChainName() ||
                `chain ${walletStore.currentChainId()}`}
            </button>
            <Show when={openMenu() === "chain"}>
              <div class="absolute right-28 top-10 z-50 min-w-[10rem] rounded-xl border border-white/10 bg-[#12121a] p-1 shadow-xl">
                <For each={["foundry", "localhost"]}>
                  {(key) => (
                    <button
                      type="button"
                      class="w-full rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10"
                      onClick={async () => {
                        closeAll()
                        await switchChain(key)
                      }}
                    >
                      {key}
                    </button>
                  )}
                </For>
              </div>
            </Show>

            <button
              type="button"
              class="rounded-lg bg-white/10 px-3 py-1.5 font-mono text-xs text-white"
              onClick={() => toggle("wallet")}
            >
              {shortAddr(user())}
            </button>
            <Show when={openMenu() === "wallet"}>
              <div class="absolute right-0 top-10 z-50 min-w-[10rem] rounded-xl border border-white/10 bg-[#12121a] p-1 shadow-xl">
                <button
                  type="button"
                  class="w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-white/10"
                  onClick={async () => {
                    closeAll()
                    await disconnectWallet()
                  }}
                >
                  {tr("wallet.disconnect")}
                </button>
              </div>
            </Show>
          </Show>
        </div>
      </div>
    </header>
  )
}

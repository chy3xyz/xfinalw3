import { Meta, MetaProvider, Title } from "@solidjs/meta"
import { Router } from "@solidjs/router"
import { FileRoutes } from "@solidjs/start/router"
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query"
import { WagmiProvider } from "@wagmi/solid"
import { type JSX, Suspense } from "solid-js"
import { WalletSync } from "~/components/site/WalletSync"
import { config } from "~/lib/web3/config"
import { setupWalletListeners } from "~/lib/web3/wallet"
import "./app.css"

const queryClient = new QueryClient()

if (typeof window !== "undefined") {
  void setupWalletListeners()
}

function Root(props: { children?: JSX.Element }) {
  return (
    <MetaProvider>
      <Title>Xfinalw3</Title>
      <Meta
        name="description"
        content="Xfinalw3 — SolidStart + @wagmi/solid Ethereum dApp scaffold"
      />
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <WalletSync />
          <Suspense
            fallback={
              <div
                class="mx-auto max-w-lg px-4 pb-24 pt-5"
                role="status"
                aria-busy="true"
              >
                <div
                  class="skeleton mb-4 rounded-2xl"
                  style={{ height: "5rem" }}
                />
                <div
                  class="skeleton mb-4 rounded-2xl"
                  style={{ height: "8rem" }}
                />
                <div class="skeleton rounded-2xl" style={{ height: "6rem" }} />
              </div>
            }
          >
            {props.children}
          </Suspense>
        </QueryClientProvider>
      </WagmiProvider>
    </MetaProvider>
  )
}

export default function App() {
  return (
    <Router root={Root}>
      <FileRoutes />
    </Router>
  )
}

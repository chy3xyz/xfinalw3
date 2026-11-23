import { useLocation } from "@solidjs/router"
import { type JSX, Suspense, createEffect } from "solid-js"
import { BottomNav } from "~/components/site/BottomNav"
import { ChainBanner } from "~/components/site/ChainBanner"
import { SiteHeader } from "~/components/site/SiteHeader"
import { SplashGate } from "~/components/site/SplashGate"
import { NotifyContainer } from "~/components/ui/NotifyContainer"
import { inviteCodeFromRefParam, rememberPendingRef } from "~/lib/web3/invite"

function PageFallback() {
  return (
    <div
      class="mx-auto max-w-lg px-4 pb-24 pt-5"
      role="status"
      aria-busy="true"
    >
      <div class="skeleton mb-4 rounded-2xl" style={{ height: "5rem" }} />
      <div class="skeleton mb-4 rounded-2xl" style={{ height: "8rem" }} />
      <div class="skeleton rounded-2xl" style={{ height: "6rem" }} />
    </div>
  )
}

/** Persist `?ref=` so bottom-nav hops don't drop the invite (MMM pattern). */
function InviteRefCapture() {
  const loc = useLocation()
  createEffect(() => {
    const q = new URLSearchParams(loc.search)
    rememberPendingRef(inviteCodeFromRefParam(q.get("ref")))
  })
  return null
}

export default function AppLayout(props: { children?: JSX.Element }) {
  return (
    <SplashGate>
      <InviteRefCapture />
      <SiteHeader />
      <ChainBanner />
      <main class="min-h-[100dvh] pt-14 text-ink-1">
        <Suspense fallback={<PageFallback />}>{props.children}</Suspense>
      </main>
      <BottomNav />
      <NotifyContainer />
    </SplashGate>
  )
}

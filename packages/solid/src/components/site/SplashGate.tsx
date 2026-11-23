import { type JSX, Show, createSignal, onMount } from "solid-js"
import { BrandLogo } from "./BrandLogo"

/** Brief splash so first paint isn't empty while wagmi reconnects. */
export function SplashGate(props: { children?: JSX.Element; ms?: number }) {
  const [ready, setReady] = createSignal(false)
  onMount(() => {
    const t = window.setTimeout(() => setReady(true), props.ms ?? 400)
    return () => clearTimeout(t)
  })
  return (
    <Show
      when={ready()}
      fallback={
        <div class="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[#0a0a0f]">
          <BrandLogo class="text-2xl" />
          <div class="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
        </div>
      }
    >
      {props.children}
    </Show>
  )
}

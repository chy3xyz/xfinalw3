import { A, useLocation } from "@solidjs/router"
import { useT } from "~/lib/i18n"

/**
 * Fixed 4-tab capsule: hrefs are literals (mmm rule).
 * Highlight groups: team/assets/faq → Me; trade children → Trade.
 */
export function BottomNav() {
  const tr = useT()
  const location = useLocation()
  const path = () => location.pathname

  const isHome = () => path() === "/" || path() === ""
  const isTrade = () => path().startsWith("/trade")
  const isSwap = () => path().startsWith("/swap")
  const isMe = () =>
    path().startsWith("/me") ||
    path().startsWith("/team") ||
    path().startsWith("/assets") ||
    path().startsWith("/faq")

  return (
    <nav
      class="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0a0a0f]/95 backdrop-blur"
      aria-label="main"
    >
      <div class="mx-auto flex h-14 max-w-lg items-stretch">
        <A
          href="/"
          class="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px]"
          classList={{ "text-white": isHome(), "text-white/45": !isHome() }}
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span>{tr("nav.home")}</span>
        </A>
        <A
          href="/trade"
          class="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px]"
          classList={{ "text-white": isTrade(), "text-white/45": !isTrade() }}
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
          <span>{tr("nav.trade")}</span>
        </A>
        <A
          href="/swap"
          class="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px]"
          classList={{ "text-white": isSwap(), "text-white/45": !isSwap() }}
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
            />
          </svg>
          <span>{tr("nav.swap")}</span>
        </A>
        <A
          href="/me"
          class="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px]"
          classList={{ "text-white": isMe(), "text-white/45": !isMe() }}
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span>{tr("nav.me")}</span>
        </A>
      </div>
    </nav>
  )
}

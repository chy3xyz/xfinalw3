import { For, Show, onCleanup, onMount } from "solid-js"
import { useT } from "~/lib/i18n"
import { notify } from "~/lib/stores/notify"

export function NotifyContainer() {
  const tr = useT()

  // 用户被钱包 App 接走签名（10~30s）期间 document 是 hidden：暂停计时，
  // 回前台按剩余时长继续，成功/失败提示不会在后台静默过期。
  onMount(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") notify.pause()
      else notify.resume()
    }
    if (document.visibilityState === "hidden") notify.pause()
    document.addEventListener("visibilitychange", onVisibility)
    onCleanup(() =>
      document.removeEventListener("visibilitychange", onVisibility)
    )
  })

  return (
    <div class="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-4 z-[9999] flex flex-col gap-2 pointer-events-none items-stretch sm:items-end">
      <For each={notify.items()}>
        {(item) => (
          // 整条 toast 一律 pointer-events-none：它压在顶栏（钱包 / 语言 / 网络切换）上，
          // 可点的话会把对顶栏的点击整个吞掉、没有任何反馈。只有下面的链接和
          // 关闭按钮重新开启 pointer-events。
          <div
            class={`toast ${item.type} pointer-events-none relative w-full sm:w-auto`}
            role="alert"
          >
            <div class="flex-shrink-0">
              {item.type === "success" && (
                <svg
                  class="w-5 h-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              )}
              {item.type === "error" && (
                <svg
                  class="w-5 h-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              )}
              {item.type === "warning" && (
                <svg
                  class="w-5 h-5 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01M5 19h14a2 2 0 001.84-2.75L13.74 4a2 2 0 00-3.48 0L3.16 16.25A2 2 0 005 19z"
                  ></path>
                </svg>
              )}
              {item.type === "info" && (
                <svg
                  class="w-5 h-5 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              )}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-100 break-words">{item.message}</p>
              <Show when={item.href}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="pointer-events-auto inline-block mt-1 text-xs text-primary hover:underline"
                >
                  {item.hrefLabel || tr("common.view")}
                </a>
              </Show>
            </div>
            <button
              type="button"
              class="pointer-events-auto shrink-0 rounded-lg p-1 -mr-1 -mt-1 text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-colors"
              aria-label={tr("announce.dismiss")}
              onClick={() => notify.remove(item.id)}
            >
              <svg
                class="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
            <div
              class="absolute bottom-0 left-0 h-0.5 bg-current opacity-30 notify-progress"
              style={{
                "--toast-ms": `${item.remaining}ms`,
                "animation-play-state": notify.paused() ? "paused" : "running"
              }}
            ></div>
          </div>
        )}
      </For>
    </div>
  )
}

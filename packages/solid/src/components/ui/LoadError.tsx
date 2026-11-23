import { Show } from "solid-js"
import { useT } from "~/lib/i18n"
import { Button } from "./Button"

export function LoadError(props: {
  when: boolean
  onRetry?: () => void
  message?: string
}) {
  const tr = useT()
  return (
    <Show when={props.when}>
      <div class="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-center">
        <p class="text-xs text-amber-400 mb-2">
          {props.message || tr("common.loadFailed")}
        </p>
        <Show when={props.onRetry}>
          {/* 错误态里唯一的重试入口：`!py-1.5` 只有 ~28px 高，是全站最小的可点区域之一。
              min-h-11 = 44px 触控下限，视觉风格（ghost + text-xs）不动。 */}
          <Button
            variant="ghost"
            type="button"
            class="!py-2.5 !px-3 min-h-11 text-xs"
            onClick={props.onRetry}
          >
            {tr("common.retry")}
          </Button>
        </Show>
      </div>
    </Show>
  )
}

import { For, Show } from "solid-js"
import { Button } from "~/components/ui/Button"
import { useT } from "~/lib/i18n"

export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const

export function Pager(props: {
  page: number
  pageSize: number
  hasMore: boolean
  total?: number | null
  onPage: (page: number) => void
  onPageSize: (size: number) => void
}) {
  const tr = useT()
  return (
    <div class="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-3 text-xs text-gray-500 dark:border-gray-700/60">
      <div class="flex items-center gap-2">
        <span>{tr("admin.pager.page", { page: props.page })}</span>
        <Show when={props.total != null}>
          <span>· {tr("admin.pager.total", { total: props.total! })}</span>
        </Show>
      </div>
      <div class="flex items-center gap-2">
        <select
          value={props.pageSize}
          onChange={(e) => props.onPageSize(Number(e.currentTarget.value))}
          class="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          aria-label={tr("admin.pager.perPage", { n: props.pageSize })}
        >
          <For each={PAGE_SIZE_OPTIONS}>
            {(s) => (
              <option value={s}>{tr("admin.pager.perPage", { n: s })}</option>
            )}
          </For>
        </select>
        <Button
          type="button"
          variant="light"
          class="!px-3 !py-1.5 !text-xs"
          disabled={props.page <= 1}
          onClick={() => props.onPage(props.page - 1)}
        >
          ‹ {tr("admin.pager.prev")}
        </Button>
        <Button
          type="button"
          variant="light"
          class="!px-3 !py-1.5 !text-xs"
          disabled={!props.hasMore}
          onClick={() => props.onPage(props.page + 1)}
        >
          {tr("admin.pager.next")} ›
        </Button>
      </div>
    </div>
  )
}

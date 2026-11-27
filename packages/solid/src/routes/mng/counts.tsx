import { Title } from "@solidjs/meta"
import { For, Show, createResource } from "solid-js"
import { AdminCard } from "~/components/admin/AdminCard"
import {
  DesktopTable,
  MobileField,
  MobileList,
  MobileRow
} from "~/components/admin/AdminMobileList"
import { AdminRoleNotice } from "~/components/admin/AdminRoleNotice"
import { indexerGraphql } from "~/lib/indexer/client"
import { useT } from "~/lib/i18n"

type CountRow = {
  id: string
  newCount: string
  blockNumber: string
  timestamp: string
}

const QUERY = /* GraphQL */ `
  query RecentCountUpdates($limit: Int!) {
    countUpdates(
      limit: $limit
      orderBy: "blockNumber"
      orderDirection: "desc"
    ) {
      items {
        id
        newCount
        blockNumber
        timestamp
      }
    }
  }
`

async function loadCounts(): Promise<CountRow[]> {
  const data = await indexerGraphql<{
    countUpdates?: { items?: CountRow[] }
  }>(QUERY, { limit: 25 })
  return data.countUpdates?.items ?? []
}

export default function AdminCountsPage() {
  const tr = useT()
  const [rows] = createResource(loadCounts)

  return (
    <>
      <Title>{tr("admin.nav.menuCounts")} · Xfinalw3</Title>
      <AdminRoleNotice />
      <AdminCard class="rounded-2xl p-6 space-y-4">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
            {tr("admin.counts.title")}
          </h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {tr("admin.counts.lead")}
          </p>
        </div>

        <Show when={rows.loading}>
          <p class="text-xs text-gray-500">{tr("admin.counts.loading")}</p>
        </Show>
        <Show when={rows.error}>
          <p class="text-xs text-red-500">
            {tr("admin.counts.error")}: {String(rows.error)}
          </p>
        </Show>

        <Show when={!rows.loading && !rows.error && (rows() ?? []).length === 0}>
          <p class="text-sm text-gray-500">{tr("admin.counts.empty")}</p>
        </Show>

        <MobileList>
          <For each={rows() ?? []}>
            {(row) => (
              <MobileRow>
                <MobileField label={tr("admin.counts.colCount")}>
                  {row.newCount}
                </MobileField>
                <MobileField label={tr("admin.counts.colBlock")}>
                  {row.blockNumber}
                </MobileField>
                <MobileField label="id">{row.id}</MobileField>
              </MobileRow>
            )}
          </For>
        </MobileList>

        <DesktopTable>
          <table class="min-w-full text-left text-sm">
            <thead class="text-xs uppercase text-gray-500">
              <tr>
                <th class="py-2 pr-4">{tr("admin.counts.colCount")}</th>
                <th class="py-2 pr-4">{tr("admin.counts.colBlock")}</th>
                <th class="py-2 pr-4">{tr("admin.counts.colTime")}</th>
                <th class="py-2">id</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <For each={rows() ?? []}>
                {(row) => (
                  <tr class="font-mono text-xs text-gray-800 dark:text-gray-200">
                    <td class="py-2 pr-4">{row.newCount}</td>
                    <td class="py-2 pr-4">{row.blockNumber}</td>
                    <td class="py-2 pr-4">{row.timestamp}</td>
                    <td class="py-2 break-all">{row.id}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </DesktopTable>
      </AdminCard>
    </>
  )
}

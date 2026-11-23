import { Title } from "@solidjs/meta"
import { Show, createResource } from "solid-js"
import { AdminCard } from "~/components/admin/AdminCard"
import { AdminRoleNotice } from "~/components/admin/AdminRoleNotice"
import { adminPing } from "~/lib/api"
import { useT } from "~/lib/i18n"
import { adminStore } from "~/lib/stores/admin"

export default function AdminDashboard() {
  const tr = useT()
  const [ping] = createResource(async () => adminPing())

  return (
    <>
      <Title>{tr("admin.nav.menuDashboard")} · Xfinalw3</Title>
      <AdminRoleNotice />
      <AdminCard class="rounded-2xl p-6 space-y-3">
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          {tr("admin.dashboard.title")}
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {tr("admin.dashboard.lead")}
        </p>
        <p class="text-xs text-gray-500">
          {tr("admin.dashboard.session")}: {adminStore.username()} ·{" "}
          {adminStore.roleLabel()}
        </p>
        <Show when={!ping.loading && ping()}>
          <p class="font-mono text-xs text-emerald-600 dark:text-emerald-400">
            /admin/ping ok · {ping()!.ts}
          </p>
        </Show>
        <Show when={ping.error}>
          <p class="text-xs text-red-500">{String(ping.error)}</p>
        </Show>
      </AdminCard>
    </>
  )
}

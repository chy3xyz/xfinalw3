/**
 * /mng — admin layout shell (Sidebar + AdminHeader + content).
 * Guard once at the layout; pages stay free of remounting chrome.
 */
import type { JSX } from "solid-js"
import { AdminGuard } from "~/components/admin/AdminGuard"
import { AdminHeader } from "~/components/admin/AdminHeader"
import { Sidebar } from "~/components/admin/Sidebar"
import { NotifyContainer } from "~/components/ui/NotifyContainer"

export default function MngLayout(props: { children?: JSX.Element }) {
  return (
    <AdminGuard>
      <div class="flex min-h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />
        <div class="flex min-w-0 flex-1 flex-col">
          <AdminHeader />
          <main class="flex-1 space-y-6 p-4 lg:p-6">{props.children}</main>
        </div>
      </div>
      <NotifyContainer />
    </AdminGuard>
  )
}

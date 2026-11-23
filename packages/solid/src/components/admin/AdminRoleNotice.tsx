import { Show } from "solid-js"
import { adminStore } from "~/lib/stores/admin"

export function AdminRoleNotice(props: {
  need?: "operator" | "owner"
  class?: string
}) {
  const need = () => props.need ?? "operator"
  return (
    <Show when={!adminStore.atLeast(need())}>
      <p
        class={`rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300 ${props.class || ""}`}
        role="status"
      >
        当前角色「{adminStore.roleLabel()}
        」为只读：本页写操作会被服务端拒绝（403）。 需要「
        {need() === "owner" ? "所有者" : "运营"}」及以上 —— 在服务端{" "}
        <span class="font-mono">ADMIN_ACCOUNTS</span> 配置。
      </p>
    </Show>
  )
}

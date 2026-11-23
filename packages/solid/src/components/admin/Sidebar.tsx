import { A, useLocation } from "@solidjs/router"
import { For } from "solid-js"
import { useT } from "~/lib/i18n"
import { menuNameForPath, uiStore } from "~/lib/stores/ui"

export function Sidebar() {
  const location = useLocation()
  const tr = useT()
  const activeName = () => menuNameForPath(location.pathname)

  function closeMobileMenu() {
    uiStore.setMobileMenuOpen(false)
  }

  return (
    <>
      {uiStore.mobileMenuOpen() && (
        <div
          class="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobileMenu}
          role="button"
          aria-label={tr("admin.nav.closeMenu")}
        />
      )}

      <aside
        class="fixed bottom-0 left-0 top-0 z-50 flex w-64 flex-shrink-0 -translate-x-full transform flex-col overflow-y-auto border-r bg-white transition-transform duration-300 dark:bg-gray-900 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0"
        classList={{ "translate-x-0": uiStore.mobileMenuOpen() }}
      >
        <div class="flex h-16 flex-shrink-0 items-center border-b border-gray-100 px-4 dark:border-gray-800">
          <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-white">
            X
          </div>
          <span class="ml-3 truncate text-sm font-semibold">
            {uiStore.portalLabel()}
          </span>
        </div>

        <nav class="p-3" aria-label={tr("admin.nav.mainNav")}>
          <For each={uiStore.menuGroups()}>
            {(group) => (
              <div class="mb-4">
                <div class="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {tr(group.titleKey)}
                </div>
                <ul class="space-y-0.5">
                  <For each={group.items}>
                    {(item) => (
                      <li>
                        <A
                          href={item.path}
                          class="sidebar-item mx-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                          classList={{ active: activeName() === item.name }}
                          onClick={closeMobileMenu}
                          aria-current={
                            activeName() === item.name ? "page" : undefined
                          }
                        >
                          <span class="flex h-5 w-5 flex-shrink-0 items-center justify-center text-base">
                            {item.icon}
                          </span>
                          <span class="truncate">{tr(item.titleKey)}</span>
                        </A>
                      </li>
                    )}
                  </For>
                </ul>
              </div>
            )}
          </For>
        </nav>
      </aside>
    </>
  )
}

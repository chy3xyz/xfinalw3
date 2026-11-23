import { useNavigate } from "@solidjs/router"
import {
  For,
  Show,
  createMemo,
  createSignal,
  onCleanup,
  onMount
} from "solid-js"
import { adminChangePassword, adminLogout, adminMe } from "~/lib/api"
import { useT } from "~/lib/i18n"
import { adminStore } from "~/lib/stores/admin"
import { notify } from "~/lib/stores/notify"
import { toggleDark, uiStore } from "~/lib/stores/ui"
import { Modal } from "../ui/Modal"
import { AdminWallet } from "./AdminWallet"

export function AdminHeader() {
  const navigate = useNavigate()
  const tr = useT()
  const [scrolled, setScrolled] = createSignal(false)
  const [cmdOpen, setCmdOpen] = createSignal(false)
  const [cmdQuery, setCmdQuery] = createSignal("")
  const [adminOpen, setAdminOpen] = createSignal(false)
  const [adminUser, setAdminUser] = createSignal<any>(null)
  const [pwdOpen, setPwdOpen] = createSignal(false)
  const [pwdForm, setPwdForm] = createSignal({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [pwdSaving, setPwdSaving] = createSignal(false)

  const allItems = createMemo(() =>
    uiStore
      .menuGroups()
      .flatMap((g) => g.items)
      .filter((i) =>
        tr(i.titleKey).toLowerCase().includes(cmdQuery().toLowerCase())
      )
  )

  function openCmd() {
    setCmdOpen(true)
    setCmdQuery("")
  }
  function closeCmd() {
    setCmdOpen(false)
    setCmdQuery("")
  }

  function onCmdKey(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault()
      openCmd()
    } else if (e.key === "Escape" && cmdOpen()) {
      closeCmd()
    }
  }

  function pickItem(item: { path: string }) {
    closeCmd()
    navigate(item.path)
  }

  async function loadAdmin() {
    try {
      const me = await adminMe()
      setAdminUser(me)
      adminStore.setMe(me)
    } catch {
      setAdminUser({ authenticated: false })
    }
  }

  async function logout() {
    try {
      await adminLogout()
      notify.success(tr("admin.nav.loggedOut"))
      window.location.reload()
    } catch (e: any) {
      notify.error(e?.message || tr("admin.nav.logoutFailed"))
    }
  }

  function openPwd() {
    setAdminOpen(false)
    setPwdForm({ oldPassword: "", newPassword: "", confirmPassword: "" })
    setPwdOpen(true)
  }

  async function savePwd() {
    const f = pwdForm()
    if (!f.oldPassword || !f.newPassword) {
      notify.error(tr("admin.nav.pwdMissing"))
      return
    }
    if (f.newPassword !== f.confirmPassword) {
      notify.error(tr("admin.nav.pwdMismatch"))
      return
    }
    setPwdSaving(true)
    try {
      await adminChangePassword({
        oldPassword: f.oldPassword,
        newPassword: f.newPassword
      })
      notify.success(tr("admin.nav.pwdChanged"))
      setPwdOpen(false)
      window.location.reload()
    } catch (e: any) {
      notify.error(e?.message || tr("admin.nav.pwdChangeFailed"))
    } finally {
      setPwdSaving(false)
    }
  }

  onMount(() => {
    window.addEventListener("keydown", onCmdKey)
    const onScroll = () => setScrolled(window.scrollY > 0)
    window.addEventListener("scroll", onScroll)
    onCleanup(() => {
      window.removeEventListener("keydown", onCmdKey)
      window.removeEventListener("scroll", onScroll)
    })
    loadAdmin()
  })

  return (
    <>
      <header
        class="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-4 transition-shadow duration-300 dark:bg-gray-900"
        classList={{ "shadow-md": scrolled() }}
      >
        <div class="flex items-center gap-3">
          <button
            type="button"
            aria-label={tr("admin.nav.openMenu")}
            onClick={() => uiStore.setMobileMenuOpen(!uiStore.mobileMenuOpen())}
            class="flex-shrink-0 rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
          >
            <svg
              class="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <button
            type="button"
            class="hidden items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 md:flex"
            onClick={openCmd}
          >
            <span>{tr("admin.nav.searchMenus")}</span>
            <kbd class="ml-2 rounded border bg-white px-1.5 py-0.5 font-mono text-xs shadow-sm dark:bg-gray-700">
              ⌘K
            </kbd>
          </button>
        </div>

        <div class="flex items-center gap-1.5">
          <AdminWallet />
          <button
            type="button"
            onClick={toggleDark}
            class="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            title={
              uiStore.dark() ? tr("admin.nav.toLight") : tr("admin.nav.toDark")
            }
          >
            <Show
              when={uiStore.dark()}
              fallback={
                <svg
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              }
            >
              <svg
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </Show>
          </button>

          <div class="relative">
            <button
              type="button"
              onClick={() => setAdminOpen(!adminOpen())}
              class="flex items-center gap-1.5 rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              title={tr("admin.nav.admin")}
            >
              <div class="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {adminUser()?.username
                  ? adminUser().username.slice(0, 1).toUpperCase()
                  : "A"}
              </div>
            </button>
            <Show when={adminOpen()}>
              <div class="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
                <div class="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-700">
                  <span class="truncate text-xs text-gray-500">
                    {adminUser()?.username || tr("admin.nav.admin")}
                  </span>
                  <span class="shrink-0 rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {adminStore.roleLabel()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={openPwd}
                  class="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50"
                >
                  {tr("admin.nav.changePwd")}
                </button>
                <button
                  type="button"
                  onClick={logout}
                  class="w-full px-3 py-2 text-left text-sm text-red-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50"
                >
                  {tr("admin.nav.logout")}
                </button>
              </div>
            </Show>
          </div>
        </div>
      </header>

      <Modal
        open={pwdOpen()}
        title={tr("admin.nav.changePwdTitle")}
        onClose={() => setPwdOpen(false)}
        variant="light"
      >
        <div class="space-y-3">
          <div>
            <label
              for="pwd-old"
              class="text-xs text-gray-600 dark:text-gray-400"
            >
              {tr("admin.nav.pwdOld")}
            </label>
            <input
              id="pwd-old"
              type="password"
              value={pwdForm().oldPassword}
              onInput={(e) =>
                setPwdForm((p) => ({
                  ...p,
                  oldPassword: e.currentTarget.value
                }))
              }
              class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-primary dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
          <div>
            <label
              for="pwd-new"
              class="text-xs text-gray-600 dark:text-gray-400"
            >
              {tr("admin.nav.pwdNew")}
            </label>
            <input
              id="pwd-new"
              type="password"
              value={pwdForm().newPassword}
              onInput={(e) =>
                setPwdForm((p) => ({
                  ...p,
                  newPassword: e.currentTarget.value
                }))
              }
              class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-primary dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
          <div>
            <label
              for="pwd-confirm"
              class="text-xs text-gray-600 dark:text-gray-400"
            >
              {tr("admin.nav.pwdConfirm")}
            </label>
            <input
              id="pwd-confirm"
              type="password"
              value={pwdForm().confirmPassword}
              onInput={(e) =>
                setPwdForm((p) => ({
                  ...p,
                  confirmPassword: e.currentTarget.value
                }))
              }
              class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-primary dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPwdOpen(false)}
              class="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-medium dark:border-gray-600"
            >
              {tr("common.cancel")}
            </button>
            <button
              type="button"
              onClick={savePwd}
              disabled={pwdSaving()}
              class="flex-1 rounded-xl bg-primary py-2.5 font-bold text-white disabled:opacity-50"
            >
              {pwdSaving() ? tr("admin.nav.pwdSaving") : tr("common.save")}
            </button>
          </div>
        </div>
      </Modal>

      <Show when={cmdOpen()}>
        <div
          class="fixed inset-0 z-[200] flex items-start justify-center bg-black/50 pt-[15vh] backdrop-blur-sm"
          onClick={closeCmd}
          role="dialog"
          aria-modal="true"
        >
          <div
            class="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
            role="document"
          >
            <div class="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <input
                value={cmdQuery()}
                onInput={(e) => setCmdQuery(e.currentTarget.value)}
                placeholder={tr("admin.nav.searchMenus")}
                class="flex-1 bg-transparent text-sm outline-none"
                autocomplete="off"
              />
              <kbd class="rounded border bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] dark:bg-gray-700">
                ESC
              </kbd>
            </div>
            <div class="max-h-[40vh] overflow-y-auto">
              {allItems().length === 0 ? (
                <p class="py-6 text-center text-sm text-gray-500">
                  {tr("admin.nav.noMatch")}
                </p>
              ) : (
                <For each={allItems()}>
                  {(item) => (
                    <button
                      type="button"
                      onClick={() => pickItem(item)}
                      class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    >
                      <span>{item.icon}</span>
                      <span>{tr(item.titleKey)}</span>
                      <span class="ml-auto font-mono text-xs text-gray-400">
                        {item.path}
                      </span>
                    </button>
                  )}
                </For>
              )}
            </div>
          </div>
        </div>
      </Show>
    </>
  )
}

import {
  Show,
  createResource,
  createSignal,
  onCleanup,
  onMount
} from "solid-js"
import { Spinner } from "~/components/ui/Spinner"
import { UNAUTH_EVENT, adminLogin, adminMe } from "~/lib/api"
import { useT } from "~/lib/i18n"
import { adminStore } from "~/lib/stores/admin"

export function AdminGuard(props: { children?: any }) {
  const tr = useT()
  const [me, { refetch }] = createResource(async () => {
    const session = await adminMe()
    adminStore.setMe(session)
    return session
  })
  const [username, setUsername] = createSignal("")
  const [password, setPassword] = createSignal("")
  const [loginError, setLoginError] = createSignal("")
  const [loggingIn, setLoggingIn] = createSignal(false)

  onMount(() => {
    const onUnauthorized = () => void refetch()
    window.addEventListener(UNAUTH_EVENT, onUnauthorized)
    onCleanup(() => window.removeEventListener(UNAUTH_EVENT, onUnauthorized))
  })

  async function submitLogin(e: Event) {
    e.preventDefault()
    if (!username() || !password() || loggingIn()) return
    setLoggingIn(true)
    setLoginError("")
    try {
      await adminLogin(username(), password())
      await refetch()
    } catch (err: any) {
      setLoginError(err?.message || tr("admin.guard.failed"))
    } finally {
      setLoggingIn(false)
    }
  }

  return (
    <Show
      when={!me.loading}
      fallback={
        <div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
          <Spinner size="lg" />
        </div>
      }
    >
      <Show
        when={!me.error && (me()?.authenticated ?? false)}
        fallback={
          <Show
            when={!me.error}
            fallback={
              <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
                <div class="w-full max-w-sm space-y-4 rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-900">
                  <p class="text-sm font-medium text-red-500">
                    {tr("admin.guard.serviceDown")}
                  </p>
                  <p class="break-all text-xs text-gray-500">
                    {String(me.error)}
                  </p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    class="w-full rounded-xl bg-primary py-2.5 font-bold text-white transition-opacity hover:opacity-90"
                  >
                    {tr("common.retry")}
                  </button>
                </div>
              </div>
            }
          >
            <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
              <form
                onSubmit={submitLogin}
                class="w-full max-w-sm space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
              >
                <h1 class="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {tr("admin.guard.title")}
                </h1>
                <div>
                  <label
                    for="guard-username"
                    class="text-xs text-gray-600 dark:text-gray-400"
                  >
                    {tr("admin.guard.username")}
                  </label>
                  <input
                    id="guard-username"
                    type="text"
                    autocomplete="username"
                    value={username()}
                    onInput={(e) => setUsername(e.currentTarget.value)}
                    class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label
                    for="guard-password"
                    class="text-xs text-gray-600 dark:text-gray-400"
                  >
                    {tr("admin.guard.password")}
                  </label>
                  <input
                    id="guard-password"
                    type="password"
                    autocomplete="current-password"
                    value={password()}
                    onInput={(e) => setPassword(e.currentTarget.value)}
                    class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <Show when={loginError()}>
                  <p class="text-xs text-red-500" role="alert">
                    {loginError()}
                  </p>
                </Show>
                <button
                  type="submit"
                  disabled={loggingIn() || !username() || !password()}
                  class="w-full rounded-xl bg-primary py-2.5 font-bold text-white disabled:opacity-50"
                >
                  {loggingIn()
                    ? tr("admin.guard.submitting")
                    : tr("admin.guard.submit")}
                </button>
              </form>
            </div>
          </Show>
        }
      >
        {props.children}
      </Show>
    </Show>
  )
}

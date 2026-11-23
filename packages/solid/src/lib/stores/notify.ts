// ============================================================
// Notify store — toast queue
// ============================================================
import { createSignal } from "solid-js"

export type NotifyType = "success" | "error" | "warning" | "info"
export interface NotifyItem {
  id: number
  type: NotifyType
  message: string
  /** 本条 toast 的显示时长（ms）—— 由容器透传成 CSS 变量 --toast-ms，进度条跟着它走 */
  timeout: number
  /** 暂停/恢复后**剩余**的显示时长（ms）—— 恢复时按它重播进度条，条走完 ⇔ toast 消失 */
  remaining: number
  href?: string
  hrefLabel?: string
}

export type NotifyOptions = {
  timeout?: number
  href?: string
  hrefLabel?: string
}

let _nextId = 1
const [items, setItems] = createSignal<NotifyItem[]>([])
/** 后台（document.hidden）期间为 true：不起表，进度条同时冻结 */
const [isPaused, setPaused] = createSignal(false)

const timers = new Map<number, ReturnType<typeof setTimeout>>()
/** 本轮计时的到期时刻（仅计时中有效），停表时按它结算剩余量 */
const deadlineOf = new Map<number, number>()
/** 每条 toast 的剩余显示时长（ms） */
const remainingOf = new Map<number, number>()

function clearTimer(id: number) {
  const t = timers.get(id)
  if (t !== undefined) {
    clearTimeout(t)
    timers.delete(id)
  }
}

/** 起表：到点即移除该条。remainingOf 始终等于按真实时长算出的剩余量 */
function startTimer(id: number, ms: number) {
  clearTimer(id)
  const left = Math.max(0, ms)
  remainingOf.set(id, left)
  deadlineOf.set(id, Date.now() + left)
  timers.set(
    id,
    setTimeout(() => remove(id), left)
  )
}

/** 停表：把已经走过的时长从剩余量里扣掉（暂停 / 手动关闭都走它） */
function stopTimer(id: number) {
  clearTimer(id)
  const deadline = deadlineOf.get(id)
  if (deadline === undefined) return
  deadlineOf.delete(id)
  remainingOf.set(id, Math.max(0, deadline - Date.now()))
}

function remove(id: number) {
  clearTimer(id)
  deadlineOf.delete(id)
  remainingOf.delete(id)
  setItems((prev) => prev.filter((i) => i.id !== id))
}

function push(
  type: NotifyItem["type"],
  message: string,
  opts?: number | NotifyOptions
) {
  const options: NotifyOptions =
    typeof opts === "number" ? { timeout: opts } : opts ?? {}
  const timeout =
    options.timeout ??
    (type === "error" ? 4000 : type === "warning" ? 3500 : 3000)
  const id = _nextId++
  setItems((prev) => [
    ...prev,
    {
      id,
      type,
      message,
      timeout,
      remaining: timeout,
      href: options.href,
      hrefLabel: options.hrefLabel
    }
  ])
  // 后台创建的提示不启表（回前台由 resume() 起表）：否则用户在钱包 App 里
  // 签完名回来，这条「链上成功 / 失败」早就静默过期了。
  if (isPaused()) remainingOf.set(id, timeout)
  else startTimer(id, timeout)
}

/**
 * 切到后台（visibilitychange → hidden）时停表。
 * 用户被钱包 App 接走签名 10~30s，回来时最该看到的那条提示不能已经消失。
 */
function pause() {
  if (isPaused()) return
  setPaused(true)
  for (const it of items()) stopTimer(it.id)
}

/** 回前台：按各自**剩余**时长继续计时（进度条用同一剩余量重播，不从头走满） */
function resume() {
  if (!isPaused()) return
  setPaused(false)
  setItems((prev) =>
    prev.map((it) => ({
      ...it,
      remaining: remainingOf.get(it.id) ?? it.timeout
    }))
  )
  for (const it of items())
    startTimer(it.id, remainingOf.get(it.id) ?? it.timeout)
}

export const notify = {
  items,
  paused: isPaused,
  pause,
  resume,
  success: (msg: string, opts?: number | NotifyOptions) =>
    push("success", msg, opts),
  error: (msg: string, opts?: number | NotifyOptions) =>
    push("error", msg, opts),
  warning: (msg: string, opts?: number | NotifyOptions) =>
    push("warning", msg, opts),
  info: (msg: string, opts?: number | NotifyOptions) => push("info", msg, opts),
  remove
}

export { copyText, promptCopy } from "~/lib/clipboard"

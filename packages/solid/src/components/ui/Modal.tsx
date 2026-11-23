import { JSX, Show, children, createEffect, onCleanup, onMount } from "solid-js"

type ModalVariant = "dark" | "light"
type ModalSize = "sm" | "md" | "lg"

const SIZE_MAX_W: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl"
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal(props: {
  open: boolean
  title?: string
  onClose?: () => void
  /** 'light' renders the admin light palette; default keeps the site dark sheet */
  variant?: ModalVariant
  size?: ModalSize
  children: JSX.Element
}) {
  const c = children(() => props.children)
  let sheetRef: HTMLDivElement | undefined

  // P2-7 a11y: 开启时初始聚焦 sheet，Tab 在 overlay 内循环（焦点圈闭）
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      props.onClose?.()
      return
    }
    if (e.key !== "Tab" || !sheetRef) return
    const focusables = Array.from(
      sheetRef.querySelectorAll<HTMLElement>(FOCUSABLE)
    )
    if (focusables.length === 0) {
      e.preventDefault()
      sheetRef.focus()
      return
    }
    const first = focusables[0]!
    const last = focusables[focusables.length - 1]!
    const active = document.activeElement as HTMLElement | null
    if (e.shiftKey && (active === first || !sheetRef.contains(active))) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && (active === last || !sheetRef.contains(active))) {
      e.preventDefault()
      first.focus()
    }
  }

  onMount(() => {
    document.addEventListener("keydown", handleKeydown)
    onCleanup(() => document.removeEventListener("keydown", handleKeydown))
  })

  // 开启瞬间把焦点移入 sheet（等 Show 渲染完成；ref 回调兜底）
  createEffect(() => {
    if (props.open) queueMicrotask(() => sheetRef?.focus())
  })

  return (
    <Show when={props.open} keyed>
      <div
        class="modal-overlay"
        onClick={props.onClose}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
      >
        <div
          ref={(el) => {
            sheetRef = el
          }}
          class={`modal-sheet ${SIZE_MAX_W[props.size || "md"]} ${props.variant === "light" ? "!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-gray-100" : ""}`}
          onClick={(e) => e.stopPropagation()}
          role="document"
          tabIndex={-1}
          style={{ outline: "none" }}
        >
          {props.title && (
            <div class="px-4 py-4 border-b border-void-edge/40 text-center">
              <span class="font-semibold text-base">{props.title}</span>
            </div>
          )}
          <div class="p-5">{c()}</div>
        </div>
      </div>
    </Show>
  )
}

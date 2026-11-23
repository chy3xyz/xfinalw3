export async function copyText(text: string): Promise<boolean> {
  if (!text) return false
  if (typeof document === "undefined") return false

  // 1) Modern Clipboard API (HTTPS / secure context)
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard?.writeText &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (e) {
      console.warn("[copyText] clipboard API failed:", e)
    }
  }

  // 2) execCommand — iOS / Huawei / older Android need an in-viewport selectable node
  if (copyViaExecCommand(text)) return true

  // 3) contentEditable fallback (some WebViews reject textarea copy)
  if (copyViaContentEditable(text)) return true

  return false
}

/**
 * Last resort for stubborn WebViews (WeChat / old iOS / Huawei):
 * show a system prompt so the user can manually copy.
 */
export function promptCopy(text: string, message?: string): boolean {
  if (!text || typeof window === "undefined") return false
  try {
    window.prompt(message || "Copy", text)
    return true
  } catch {
    return false
  }
}

function isAppleTouch(): boolean {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent || ""
  if (/ipad|iphone|ipod/i.test(ua)) return true
  // iPadOS desktop UA
  return (
    navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1
  )
}

function copyViaExecCommand(text: string): boolean {
  const ta = document.createElement("textarea")
  ta.value = text
  ta.setAttribute("readonly", "")
  ta.setAttribute("aria-hidden", "true")
  // Must stay in viewport — off-screen / pointer-events:none breaks iOS Safari & many WebViews
  ta.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    "width:1px",
    "height:1px",
    "padding:0",
    "margin:0",
    "border:0",
    "outline:none",
    "box-shadow:none",
    "background:transparent",
    "opacity:0.01",
    "z-index:2147483647",
    "font-size:16px", // avoid iOS zoom
    "-webkit-user-select:text",
    "user-select:text"
  ].join(";")

  document.body.appendChild(ta)

  try {
    if (isAppleTouch()) {
      ta.contentEditable = "true"
      ta.readOnly = false
      const range = document.createRange()
      range.selectNodeContents(ta)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
      ta.setSelectionRange(0, text.length)
    } else {
      ta.focus()
      ta.select()
      ta.setSelectionRange(0, text.length)
    }
    const ok = document.execCommand("copy")
    return !!ok
  } catch (e) {
    console.warn("[copyText] execCommand failed:", e)
    return false
  } finally {
    if (ta.parentNode) document.body.removeChild(ta)
    try {
      window.getSelection()?.removeAllRanges()
    } catch {
      /* ignore */
    }
  }
}

function copyViaContentEditable(text: string): boolean {
  const div = document.createElement("div")
  div.contentEditable = "true"
  div.textContent = text
  div.setAttribute("aria-hidden", "true")
  div.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    "width:1px",
    "height:1px",
    "opacity:0.01",
    "z-index:2147483647",
    "font-size:16px",
    "-webkit-user-select:text",
    "user-select:text",
    "white-space:pre"
  ].join(";")
  document.body.appendChild(div)

  try {
    const range = document.createRange()
    range.selectNodeContents(div)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    const ok = document.execCommand("copy")
    return !!ok
  } catch (e) {
    console.warn("[copyText] contentEditable copy failed:", e)
    return false
  } finally {
    if (div.parentNode) document.body.removeChild(div)
    try {
      window.getSelection()?.removeAllRanges()
    } catch {
      /* ignore */
    }
  }
}

import { createSignal } from "solid-js"
import en from "./en.json"
import zhCN from "./zh-CN.json"

export const SUPPORTED_LOCALES = ["en", "zh-CN"] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

const messages: Record<Locale, Record<string, unknown>> = {
  en,
  "zh-CN": zhCN
}

const STORAGE_KEY = "xfinalw3_locale"

function detectLocale(): Locale {
  try {
    const stored =
      typeof window !== "undefined" && window.localStorage?.getItem(STORAGE_KEY)
    if (stored === "zh-CN") return "zh-CN"
    if (stored === "en") return "en"
  } catch {
    /* ignore */
  }
  try {
    if ((navigator.language || "").toLowerCase().startsWith("zh"))
      return "zh-CN"
  } catch {
    /* ignore */
  }
  return "en"
}

const [locale, setLocaleRaw] = createSignal<Locale>(detectLocale())

export function setLocale(loc: Locale) {
  setLocaleRaw(loc)
  try {
    window.localStorage?.setItem(STORAGE_KEY, loc)
  } catch {
    /* ignore */
  }
}

function lookupKey(
  dict: Record<string, unknown>,
  key: string
): string | undefined {
  let obj: unknown = dict
  for (const p of key.split(".")) {
    if (
      obj &&
      typeof obj === "object" &&
      p in (obj as Record<string, unknown>)
    ) {
      obj = (obj as Record<string, unknown>)[p]
    } else {
      return undefined
    }
  }
  return typeof obj === "string" ? obj : undefined
}

export function t(
  key: string,
  vars?: Record<string, string | number> | string
): string {
  const cur = locale()
  for (const loc of [cur, "en", "zh-CN"] as Locale[]) {
    const hit = lookupKey(messages[loc], key)
    if (hit !== undefined) {
      if (typeof vars === "string" || !vars) return hit
      let out = hit
      for (const [k, v] of Object.entries(vars)) {
        out = out.replace(new RegExp(`\\{${k}\\}`, "g"), String(v))
      }
      return out
    }
  }
  return typeof vars === "string" ? vars : key
}

export const i18n = { locale, setLocale, t }

export function useT() {
  return t
}

export function localeFlag(loc: Locale): string {
  return loc === "zh-CN" ? "🇨🇳" : "🇺🇸"
}

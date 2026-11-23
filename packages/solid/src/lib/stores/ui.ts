/**
 * Admin UI store — portal label / menu groups / mobile menu / theme.
 * Register new admin pages in MENU_GROUPS.
 */
import { createSignal } from "solid-js"
import { t } from "~/lib/i18n"

export interface MenuItem {
  name: string
  path: string
  titleKey: string
  icon: string
}

export interface MenuGroup {
  titleKey: string
  items: MenuItem[]
}

const [mobileMenuOpen, setMobileMenuOpen] = createSignal(false)
const [portalLabelKey, setPortalLabelKey] = createSignal(
  "admin.nav.portalTitle"
)
const portalLabel = (): string => t(portalLabelKey())
const [dark, setDark] = createSignal(false)
const [sidebarOpen, setSidebarOpen] = createSignal(false)

const MENU_GROUPS: MenuGroup[] = [
  {
    titleKey: "admin.nav.groupOverview",
    items: [
      {
        name: "dashboard",
        path: "/mng",
        titleKey: "admin.nav.menuDashboard",
        icon: "🏠"
      },
      {
        name: "debug",
        path: "/debug",
        titleKey: "admin.nav.menuDebug",
        icon: "🐛"
      }
    ]
  }
]

export const uiStore = {
  mobileMenuOpen,
  setMobileMenuOpen,
  portalLabel,
  setPortalLabel: setPortalLabelKey,
  dark,
  menuGroups: (): MenuGroup[] => MENU_GROUPS,
  sidebarOpen,
  setSidebarOpen
}

export function menuNameForPath(pathname: string): string {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname
  for (const group of MENU_GROUPS) {
    for (const item of group.items) {
      if (item.path === p) return item.name
    }
  }
  return ""
}

function applyDark(next: boolean): void {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", next)
  }
}

export function toggleDark(): void {
  const next = !dark()
  setDark(next)
  try {
    localStorage.setItem("xfinalw3_admin_dark", next ? "1" : "0")
  } catch {
    /* ignore */
  }
  applyDark(next)
}

if (typeof window !== "undefined") {
  try {
    if (localStorage.getItem("xfinalw3_admin_dark") === "1") {
      setDark(true)
      applyDark(true)
    }
  } catch {
    /* ignore */
  }
}

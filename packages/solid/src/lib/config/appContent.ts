/**
 * Product-facing scaffold content (static).
 * Replace with indexer GraphQL / CMS later — keep shapes stable.
 */

export type Announcement = {
  id: string
  /** i18n key under announcements.* */
  textKey: string
  href?: string
}

export type FeatureEntry = {
  id: string
  href: string
  /** i18n keys */
  titleKey: string
  descKey: string
  icon: string
  /** highlight on home grid */
  hot?: boolean
}

export type FaqItem = {
  id: string
  qKey: string
  aKey: string
}

/** Ticker / poster strip on home */
export const ANNOUNCEMENTS: Announcement[] = [
  { id: "a1", textKey: "announcements.welcome", href: "/faq" },
  { id: "a2", textKey: "announcements.rpcProxy", href: "/faq" },
  { id: "a3", textKey: "announcements.scaffold", href: "/debug" }
]

/** Home feature entry grid — basic business surface, not product-specific */
export const HOME_FEATURES: FeatureEntry[] = [
  {
    id: "trade",
    href: "/trade",
    titleKey: "features.trade.title",
    descKey: "features.trade.desc",
    icon: "↔",
    hot: true
  },
  {
    id: "swap",
    href: "/swap",
    titleKey: "features.swap.title",
    descKey: "features.swap.desc",
    icon: "⇄"
  },
  {
    id: "assets",
    href: "/assets",
    titleKey: "features.assets.title",
    descKey: "features.assets.desc",
    icon: "◈"
  },
  {
    id: "team",
    href: "/team",
    titleKey: "features.team.title",
    descKey: "features.team.desc",
    icon: "◎"
  },
  {
    id: "faq",
    href: "/faq",
    titleKey: "features.faq.title",
    descKey: "features.faq.desc",
    icon: "?"
  },
  {
    id: "me",
    href: "/me",
    titleKey: "features.me.title",
    descKey: "features.me.desc",
    icon: "◉"
  }
]

export const FAQ_ITEMS: FaqItem[] = [
  { id: "f1", qKey: "faq.q1", aKey: "faq.a1" },
  { id: "f2", qKey: "faq.q2", aKey: "faq.a2" },
  { id: "f3", qKey: "faq.q3", aKey: "faq.a3" },
  { id: "f4", qKey: "faq.q4", aKey: "faq.a4" }
]

/** Me-page quick links */
export const ME_LINKS: FeatureEntry[] = [
  {
    id: "assets",
    href: "/assets",
    titleKey: "features.assets.title",
    descKey: "features.assets.desc",
    icon: "◈"
  },
  {
    id: "team",
    href: "/team",
    titleKey: "features.team.title",
    descKey: "features.team.desc",
    icon: "◎"
  },
  {
    id: "faq",
    href: "/faq",
    titleKey: "features.faq.title",
    descKey: "features.faq.desc",
    icon: "?"
  },
  {
    id: "trade",
    href: "/trade",
    titleKey: "features.trade.title",
    descKey: "features.trade.desc",
    icon: "↔"
  }
]

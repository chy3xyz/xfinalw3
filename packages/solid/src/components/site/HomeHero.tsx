import { A } from "@solidjs/router"
import { Button } from "~/components/ui/Button"
import { useT } from "~/lib/i18n"

/** Full-bleed-feel poster block for the user home (scaffold). */
export function HomeHero(props: {
  onPrimary?: () => void
  primaryHref?: string
}) {
  const tr = useT()
  return (
    <section class="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-[#1a1408] via-[#111118] to-[#0a0a0f] p-5">
      <div
        class="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl"
        aria-hidden="true"
      />
      <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
        {tr("home.poster.eyebrow")}
      </p>
      <h1 class="mt-2 text-[1.65rem] font-bold leading-tight tracking-tight text-ink-1">
        {tr("home.poster.title")}
      </h1>
      <p class="mt-2 max-w-[18rem] text-sm leading-relaxed text-ink-2">
        {tr("home.poster.sub")}
      </p>
      <div class="mt-4 flex flex-wrap gap-2">
        {props.primaryHref ? (
          <A href={props.primaryHref} class="inline-flex">
            <Button type="button" class="!py-2.5 !px-4">
              {tr("home.poster.cta")}
            </Button>
          </A>
        ) : (
          <Button type="button" class="!py-2.5 !px-4" onClick={props.onPrimary}>
            {tr("home.poster.cta")}
          </Button>
        )}
        <A
          href="/faq"
          class="inline-flex min-h-11 items-center rounded-xl border border-void-edge/40 px-4 text-sm text-ink-2 hover:border-primary/40 hover:text-primary"
        >
          {tr("home.poster.secondary")}
        </A>
      </div>
    </section>
  )
}

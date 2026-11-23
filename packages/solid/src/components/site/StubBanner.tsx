import { useT } from "~/lib/i18n"

/** Marks scaffold pages that await product wiring. */
export function StubBanner(props: { class?: string }) {
  const tr = useT()
  return (
    <p
      class={`rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90 ${props.class || ""}`}
      role="note"
    >
      {tr("common.scaffoldStub")}
    </p>
  )
}

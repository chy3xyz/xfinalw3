import { A } from "@solidjs/router"

export function BrandLogo(props: { class?: string }) {
  return (
    <A
      href="/"
      class={`font-semibold tracking-tight text-white hover:opacity-90 ${props.class ?? ""}`}
    >
      Xfinalw3
    </A>
  )
}

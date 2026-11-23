import { Show } from "solid-js"

type SpinnerSize = "sm" | "md" | "lg"

const SIZE: Record<SpinnerSize, string> = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-[3px]"
}

export function Spinner(props: { size?: SpinnerSize; class?: string }) {
  return (
    <Show when={true}>
      <span
        role="status"
        aria-label="loading"
        class={`inline-block rounded-full border-current border-t-transparent text-primary animate-spin ${SIZE[props.size || "md"]} ${props.class || ""}`}
      />
    </Show>
  )
}

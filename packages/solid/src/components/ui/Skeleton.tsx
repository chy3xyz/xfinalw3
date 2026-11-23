export function Skeleton(props: {
  width?: string
  height?: string
  rounded?: string
  class?: string
}) {
  return (
    <div
      class={`skeleton ${props.class || ""} ${props.rounded || "rounded-xl"}`}
      style={{ width: props.width || "100%", height: props.height || "1rem" }}
    />
  )
}

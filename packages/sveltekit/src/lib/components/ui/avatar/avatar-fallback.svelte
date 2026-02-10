<script lang="ts">
	import { cn } from "$lib/utils/cn.js";
	import { Avatar as AvatarPrimitive } from "bits-ui";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = AvatarPrimitive.FallbackProps & HTMLAttributes<HTMLSpanElement>;

	let { class: className, children, ...restProps }: Props = $props();
</script>

<AvatarPrimitive.Fallback
	class={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}
	{...restProps}
>
	{@render children?.()}
</AvatarPrimitive.Fallback>

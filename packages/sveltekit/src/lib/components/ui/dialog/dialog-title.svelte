<script lang="ts">
	import { cn } from "$lib/utils/cn.js";
	import { Dialog as DialogPrimitive } from "bits-ui";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = DialogPrimitive.TitleProps & HTMLAttributes<HTMLHeadingElement>;

	let { class: className, children, ...restProps }: Props = $props();
</script>

<DialogPrimitive.Title
	class={cn("text-lg font-semibold leading-none tracking-tight", className)}
	{...restProps}
>
	{@render children?.()}
</DialogPrimitive.Title>

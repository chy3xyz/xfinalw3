<script lang="ts">
	import { cn } from "$lib/utils/cn.js";
	import { Dialog as DialogPrimitive } from "bits-ui";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = DialogPrimitive.OverlayProps & HTMLAttributes<HTMLDivElement>;

	let { class: className, ...restProps }: Props = $props();
</script>

<DialogPrimitive.Overlay
	class={cn(
		"fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
		className
	)}
	{...restProps}
/>

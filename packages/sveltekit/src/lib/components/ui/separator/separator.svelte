<script lang="ts">
	import { cn } from "$lib/utils/cn.js";
	import { Separator as SeparatorPrimitive } from "bits-ui";

	type SeparatorProps = {
		orientation?: "horizontal" | "vertical";
		decorative?: boolean;
		class?: string;
	};

	let {
		class: className = "",
		orientation = "horizontal",
		decorative = true,
		...restProps
	}: SeparatorProps = $props();
</script>

<SeparatorPrimitive.Root
	orientation={orientation}
	decorative={decorative}
	class={cn("shrink-0 bg-border", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className)}
	{...restProps}
/>


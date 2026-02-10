<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import { cn } from "$lib/utils/cn.js";
	import type { Snippet } from "svelte";

	type DropdownMenuContentProps = {
		align?: "start" | "center" | "end";
		side?: "top" | "right" | "bottom" | "left";
		sideOffset?: number;
		alignOffset?: number;
		class?: string;
		children?: Snippet;
	};

	let {
		class: className = "",
		align = "start",
		side = "bottom",
		sideOffset = 4,
		alignOffset = 0,
		children,
		...restProps
	}: DropdownMenuContentProps = $props();
</script>

<DropdownMenuPrimitive.Content
	align={align}
	side={side}
	sideOffset={sideOffset}
	alignOffset={alignOffset}
	class={cn(
		"z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</DropdownMenuPrimitive.Content>


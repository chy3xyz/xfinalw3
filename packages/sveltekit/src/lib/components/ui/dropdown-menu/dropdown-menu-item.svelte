<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import { cn } from "$lib/utils/cn.js";
	import type { Snippet } from "svelte";

	type DropdownMenuItemProps = {
		disabled?: boolean;
		onSelect?: () => void;
		class?: string;
		children?: Snippet;
	};

	let {
		class: className = "",
		disabled = false,
		onSelect,
		children,
		...restProps
	}: DropdownMenuItemProps = $props();
</script>

<DropdownMenuPrimitive.Item
	disabled={disabled}
	onSelect={onSelect}
	class={cn(
		"relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</DropdownMenuPrimitive.Item>


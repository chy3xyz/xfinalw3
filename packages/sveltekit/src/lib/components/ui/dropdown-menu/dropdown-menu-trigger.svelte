<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import { cn } from "$lib/utils/cn.js";
	import type { Snippet } from "svelte";

	type DropdownMenuTriggerProps = {
		asChild?: boolean;
		class?: string;
		child?: Snippet<[{ props: any }]>;
		children?: Snippet;
	};

	let {
		class: className = "",
		asChild = false,
		child,
		children,
		...restProps
	}: DropdownMenuTriggerProps = $props();
</script>

<DropdownMenuPrimitive.Trigger
	class={cn(className)}
	{...restProps}
>
	{#if asChild && child}
		{@render child({ props: restProps })}
	{:else if children}
		{@render children()}
	{/if}
</DropdownMenuPrimitive.Trigger>


<script lang="ts">
	import { cn } from "$lib/utils/cn.js";
	import type { HTMLInputAttributes } from "svelte/elements";

	type InputProps = HTMLInputAttributes & {
		value?: string | number;
		ref?: HTMLInputElement | null;
	};

	let {
		class: className = "",
		type = "text",
		value = $bindable(),
		ref = $bindable(null),
		...restProps
	}: InputProps = $props();
</script>

<input
	bind:this={ref}
	{type}
	{value}
	oninput={(e) => {
		value = (e.target as HTMLInputElement).value;
	}}
	class={cn(
		"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
		className
	)}
	{...restProps}
/>

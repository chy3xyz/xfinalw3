<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import type { Snippet } from "svelte";

	type DropdownMenuRootProps = {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		children?: Snippet;
	};

	let {
		open,
		onOpenChange,
		children,
		...restProps
	}: DropdownMenuRootProps = $props();
</script>

<DropdownMenuPrimitive.Root
	open={open}
	onOpenChange={onOpenChange}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</DropdownMenuPrimitive.Root>



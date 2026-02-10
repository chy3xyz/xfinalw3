<script lang="ts">
	import { cn } from "$lib/utils/cn.js";
	import { Tabs as TabsPrimitive } from "bits-ui";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = TabsPrimitive.ContentProps & HTMLAttributes<HTMLDivElement>;

	let { class: className, children, ...restProps }: Props = $props();
</script>

<TabsPrimitive.Content
	class={cn(
		"mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</TabsPrimitive.Content>

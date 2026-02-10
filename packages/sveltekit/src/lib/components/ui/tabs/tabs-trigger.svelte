<script lang="ts">
	import { cn } from "$lib/utils/cn.js";
	import { Tabs as TabsPrimitive } from "bits-ui";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = TabsPrimitive.TriggerProps & HTMLAttributes<HTMLButtonElement>;

	let { class: className, children, ...restProps }: Props = $props();
</script>

<TabsPrimitive.Trigger
	class={cn(
		"inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
		"data-[state=active]:bg-[var(--luke-primary)] data-[state=active]:text-black data-[state=active]:shadow-md data-[state=active]:font-semibold",
		"data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted/50",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</TabsPrimitive.Trigger>

<script lang="ts">
	import { cn } from "$lib/utils/cn.js";
	import type { HTMLAttributes } from "svelte/elements";

	type CardProps = HTMLAttributes<HTMLDivElement>;

	let { class: className = "", ...restProps }: CardProps = $props();
</script>

<div class={cn("rounded-xl border border-border bg-card text-card-foreground shadow-sm", className)} {...restProps}>
	<slot />
</div>


<script lang="ts">
	import { cn } from "$lib/utils/cn.js";
	import type { HTMLAttributes } from "svelte/elements";
	import { badgeVariants, type VariantProps } from "./badge.js";

	type BadgeProps = HTMLAttributes<HTMLDivElement> & VariantProps;

	let {
		class: className = "",
		variant = "default",
		...restProps
	}: BadgeProps = $props();

	const classes = $derived(cn(badgeVariants({ variant }), className));
</script>

<div class={classes} {...restProps}>
	<slot />
</div>


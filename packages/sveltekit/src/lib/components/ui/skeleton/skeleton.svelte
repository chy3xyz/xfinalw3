<script lang="ts">
	import { cn } from "$lib/utils/cn.js";
	import type { HTMLAttributes } from "svelte/elements";

	type SkeletonProps = HTMLAttributes<HTMLDivElement>;

	let { class: className = "", ...restProps }: SkeletonProps = $props();
</script>

<div class={cn("animate-pulse rounded-md bg-muted", className)} {...restProps} />


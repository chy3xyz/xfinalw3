<script lang="ts">
	import { cn } from "$lib/utils/cn.js";
	import type { HTMLAttributes } from "svelte/elements";

	type CardHeaderProps = HTMLAttributes<HTMLDivElement>;

	let { class: className = "", ...restProps }: CardHeaderProps = $props();
</script>

<div class={cn("flex flex-col space-y-1.5 p-4", className)} {...restProps}>
	<slot />
</div>


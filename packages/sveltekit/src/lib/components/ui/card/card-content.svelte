<script lang="ts">
	import { cn } from "$lib/utils/cn.js";
	import type { HTMLAttributes } from "svelte/elements";

	type CardContentProps = HTMLAttributes<HTMLDivElement>;

	let { class: className = "", ...restProps }: CardContentProps = $props();
</script>

<div class={cn("p-4 pt-0", className)} {...restProps}>
	<slot />
</div>


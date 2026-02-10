<script lang="ts">
	import { cn } from "$lib/utils/cn.js";
	import type { HTMLAttributes } from "svelte/elements";

	type CardTitleProps = HTMLAttributes<HTMLHeadingElement>;

	let { class: className = "", ...restProps }: CardTitleProps = $props();
</script>

<h3 class={cn("font-semibold leading-none tracking-tight text-lg", className)} {...restProps}>
	<slot />
</h3>


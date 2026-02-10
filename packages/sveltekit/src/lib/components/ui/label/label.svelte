<script lang="ts">
	import { cn } from "$lib/utils/cn.js";
	import type { LabelHTMLAttributes } from "svelte/elements";

	type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

	let { class: className = "", ...restProps }: LabelProps = $props();
</script>

<label class={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...restProps}>
	<slot />
</label>


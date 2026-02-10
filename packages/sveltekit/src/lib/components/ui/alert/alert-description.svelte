<script lang="ts">
	import { cn } from "$lib/utils/cn.js";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = HTMLAttributes<HTMLParagraphElement>;

	let { class: className, children, ...restProps }: Props = $props();
</script>

<div class={cn("text-sm [&_p]:leading-relaxed", className)} {...restProps}>
	{@render children?.()}
</div>

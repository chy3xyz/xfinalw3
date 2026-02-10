<script lang="ts">
	import { cn } from "$lib/utils/cn.js";
	import { Dialog as DialogPrimitive } from "bits-ui";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = DialogPrimitive.DescriptionProps & HTMLAttributes<HTMLParagraphElement>;

	let { class: className, children, ...restProps }: Props = $props();
</script>

<DialogPrimitive.Description class={cn("text-sm text-muted-foreground", className)} {...restProps}>
	{@render children?.()}
</DialogPrimitive.Description>

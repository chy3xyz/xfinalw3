<script lang="ts">
	import { cn } from "$lib/utils/cn.js";
	import type { HTMLAttributes } from "svelte/elements";
	import { alertVariants, type AlertVariant } from "./alert.js";

	type Props = HTMLAttributes<HTMLDivElement> & {
		variant?: AlertVariant;
	};

	let { class: className, variant = "default", children, ...restProps }: Props = $props();
</script>

<div role="alert" class={cn(alertVariants({ variant }), className)} {...restProps}>
	{@render children?.()}
</div>

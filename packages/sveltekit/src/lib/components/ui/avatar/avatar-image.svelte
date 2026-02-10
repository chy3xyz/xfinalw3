<script lang="ts">
	import { cn } from "$lib/utils/cn.js";
	import { Avatar as AvatarPrimitive } from "bits-ui";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = AvatarPrimitive.ImageProps & HTMLAttributes<HTMLImageElement>;

	let { class: className, ...restProps }: Props = $props();
</script>

<AvatarPrimitive.Image class={cn("aspect-square h-full w-full", className)} {...restProps} />

<script lang="ts">
	import { cn } from "$lib/utils/cn.js";
	import type { ButtonHTMLAttributes, HTMLAnchorAttributes } from "svelte/elements";
	import { buttonVariants, type VariantProps } from "./button.js";

	type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
		VariantProps & {
			href?: string;
			variant?: VariantProps["variant"];
			size?: VariantProps["size"];
			asChild?: boolean;
		};

	let {
		class: className = "",
		variant = "default",
		size = "default",
		asChild = false,
		href,
		...restProps
	}: ButtonProps = $props();

	const classes = $derived(cn(buttonVariants({ variant, size }), className));
</script>

{#if href}
	<a href={href} class={classes} {...(restProps as HTMLAnchorAttributes)}>
		<slot />
	</a>
{:else}
	<button class={classes} {...(restProps as ButtonHTMLAttributes<HTMLButtonElement>)}>
		<slot />
	</button>
{/if}


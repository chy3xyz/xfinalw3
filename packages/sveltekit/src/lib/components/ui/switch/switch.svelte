<script lang="ts">
	import { cn } from "$lib/utils/cn.js";
	import { Switch as SwitchPrimitive } from "bits-ui";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = SwitchPrimitive.RootProps & HTMLAttributes<HTMLButtonElement> & {
		checked?: boolean;
		onCheckedChange?: (checked: boolean) => void;
	};

	let { class: className, checked = $bindable(false), onCheckedChange, ...restProps }: Props = $props();
</script>

<SwitchPrimitive.Root
	bind:checked
	onCheckedChange={onCheckedChange}
	class={cn(
		"peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
		className
	)}
	{...restProps}
>
	<SwitchPrimitive.Thumb
		class={cn(
			"pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
		)}
	/>
</SwitchPrimitive.Root>

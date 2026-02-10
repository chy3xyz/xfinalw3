<script lang="ts">
	import { cn } from "$lib/utils/cn.js";
	import { Dialog as DialogPrimitive } from "bits-ui";
	import type { HTMLAttributes } from "svelte/elements";
	import DialogOverlay from "./dialog-overlay.svelte";

	type Props = DialogPrimitive.ContentProps & HTMLAttributes<HTMLDivElement> & {
		position?: 'center' | 'top';
	};

	let { class: className, children, position = 'center', style, ...restProps }: Props = $props();
	
	// 统一使用无动画的基础类，避免 Tailwind CSS 变量覆盖定位
	const baseClasses = 'fixed z-50 grid w-full max-w-lg gap-4 border border-white/[0.08] bg-[#1a1a1a]/90 backdrop-blur-xl p-6 shadow-xl sm:rounded-3xl text-white';
	
	// 使用内联 style 强制定位（不受 Tailwind CSS 变量影响）
	const positionStyle = position === 'top'
		? 'top: 80px; left: 50%; transform: translateX(-50%); max-width: calc(100% - 32px);'
		: 'top: 50%; left: 50%; transform: translate(-50%, -50%); max-width: calc(100% - 32px);';
	
	const finalStyle = style ? `${positionStyle} ${style}` : positionStyle;
</script>

<DialogPrimitive.Portal>
	<DialogOverlay />
	<DialogPrimitive.Content
		class={cn(baseClasses, className)}
		style={finalStyle}
		{...restProps}
	>
		{@render children?.()}
	</DialogPrimitive.Content>
</DialogPrimitive.Portal>

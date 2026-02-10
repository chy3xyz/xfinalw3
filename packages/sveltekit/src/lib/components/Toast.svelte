<script lang="ts">
	import { toasts, notification, type Toast } from '$lib/utils/notification.js';
	import { onMount } from 'svelte';

	let mounted = false;
	onMount(() => {
		mounted = true;
	});

	function getStatusIcon(status: Toast['status']) {
		switch (status) {
			case 'success':
				return '✓';
			case 'error':
				return '✕';
			case 'warning':
				return '⚠';
			case 'info':
				return 'ℹ';
			case 'loading':
				return null;
		}
	}

	function getStatusClass(status: Toast['status']) {
		switch (status) {
			case 'success':
				return 'text-success';
			case 'error':
				return 'text-error';
			case 'warning':
				return 'text-warning';
			case 'info':
				return 'text-info';
			case 'loading':
				return '';
		}
	}


	function formatContent(content: Toast['content']): string {
		if (typeof content === 'string') {
			return content;
		}
		return content.message;
	}

	function hasBlockExplorerLink(content: Toast['content']): boolean {
		return typeof content === 'object' && content.blockExplorerLink !== undefined;
	}

	function getBlockExplorerLink(content: Toast['content']): string | undefined {
		if (typeof content === 'object') {
			return content.blockExplorerLink;
		}
		return undefined;
	}

	function getGroupedToasts(): Array<[string, Toast[]]> {
		const grouped = $toasts.reduce((acc, toast) => {
			const pos = toast.position || 'top-center';
			if (!acc[pos]) acc[pos] = [];
			acc[pos].push(toast);
			return acc;
		}, {} as Record<string, Toast[]>);
		return Object.entries(grouped) as Array<[string, Toast[]]>;
	}

	function getPositionClasses(position: string): string {
		const classes: string[] = [];
		if (position.includes('left')) {
			classes.push('left-0');
		} else if (position.includes('right')) {
			classes.push('right-0');
		} else {
			// center
			classes.push('left-1/2');
			classes.push('-translate-x-1/2');
		}
		if (position.startsWith('top')) {
			classes.push('top-0');
		} else if (position.startsWith('bottom')) {
			classes.push('bottom-0');
		}
		return classes.join(' ');
	}

	function getToastClasses(toast: Toast, position: string): string {
		const classes: string[] = [];
		if (!toast.visible) {
			classes.push('opacity-0');
			if (position.startsWith('top')) {
				classes.push('-translate-y-4');
			} else if (position.startsWith('bottom')) {
				classes.push('translate-y-4');
			}
		} else {
			classes.push('translate-y-0');
		}
		return classes.join(' ');
	}
</script>

{#if mounted}
	<div class="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
		{#each getGroupedToasts() as [position, positionToasts]}
			<div
				class="absolute flex flex-col gap-2 pointer-events-none p-4 {getPositionClasses(position)}"
				style="max-width: 420px;"
			>
				{#each positionToasts as toast (toast.id)}
					<div
						class="pointer-events-auto flex flex-row items-start gap-3 w-full max-w-sm rounded-xl border border-white/[0.08] bg-[#1a1a1a] text-white p-4 shadow-xl transition-all duration-300 ease-out {getToastClasses(toast, position)}"
						style="min-width: 300px;"
					>
						<!-- Icon -->
						<div class="shrink-0 mt-0.5">
							{#if toast.status === 'loading'}
								<svg class="w-5 h-5 animate-spin text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
							{:else if toast.icon}
								<span class="text-lg">{toast.icon}</span>
							{:else}
								<span class="text-base font-medium {getStatusClass(toast.status)}">{getStatusIcon(toast.status)}</span>
							{/if}
						</div>
						
						<!-- Content -->
						<div class="flex-1 min-w-0 overflow-hidden">
							<p class="text-sm text-white/95 break-words whitespace-normal">
							{formatContent(toast.content)}
							</p>
							{#if hasBlockExplorerLink(toast.content)}
								{@const link = getBlockExplorerLink(toast.content)}
								{#if link}
									<a href={link} target="_blank" rel="noreferrer" class="inline-flex items-center gap-1 text-xs text-white/70 hover:text-white mt-1.5 transition-colors">
										View transaction
										<svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
										</svg>
									</a>
								{/if}
							{/if}
						</div>
						
						<!-- Close button -->
						<button
							type="button"
							class="shrink-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
							on:click={() => notification.remove(toast.id)}
							aria-label="Close notification"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				{/each}
			</div>
		{/each}
	</div>
{/if}


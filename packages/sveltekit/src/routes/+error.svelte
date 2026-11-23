<script lang="ts">
import { page } from "$app/state"
</script>

<svelte:head>
	<title>{page.status} — Error</title>
</svelte:head>

<div
	class="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center text-white"
	data-theme="dark"
>
	<p class="text-6xl font-semibold tracking-tight text-white/85">{page.status}</p>
	<p class="max-w-md text-lg text-white/65">
		{page.error?.message ?? 'Something went wrong'}
	</p>
	<a href="/" class="mt-2 text-[var(--luke-primary,#7dd3fc)] underline underline-offset-4 hover:opacity-90">
		Back home
	</a>
</div>

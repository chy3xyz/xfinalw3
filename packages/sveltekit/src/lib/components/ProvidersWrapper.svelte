<script lang="ts">
import { browser } from "$app/env"
import { getWagmiContext } from "$lib/contexts/wagmi.js"
import { QueryClientProvider } from "@tanstack/svelte-query"
import type { QueryClient } from "@tanstack/svelte-query"

const context = getWagmiContext()
let clientValue: QueryClient | null = null
if (browser && context.queryClient) {
  clientValue = context.queryClient
}
</script>

{#if clientValue}
  <QueryClientProvider client={clientValue}>
    <slot />
  </QueryClientProvider>
{:else}
  <slot />
{/if}

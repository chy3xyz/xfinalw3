<script lang="ts">
  import { browser } from '$app/environment';
  import { getPublicClient } from '@wagmi/core';
  import { hardhat } from 'viem/chains';
  import { isAddress, isHex } from 'viem';
  import { goto } from '$app/navigation';
  import { wagmiConfig } from '$lib/config/wagmi.js';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';

  let searchInput = '';

  async function handleSearch(event: Event) {
    event.preventDefault();
    
    if (!browser) return;
    
    const trimmedInput = searchInput.trim();
    
    // First check if it's an address (more specific check)
    if (isAddress(trimmedInput)) {
      goto(`/blockexplorer/address/${trimmedInput}`);
      return;
    }
    
    // Then check if it's a valid transaction hash (66 chars: 0x + 64 hex chars)
    if (isHex(trimmedInput) && trimmedInput.length === 66) {
      try {
        const publicClient = getPublicClient(wagmiConfig, { chainId: hardhat.id });
        const tx = await publicClient?.getTransaction({ hash: trimmedInput as `0x${string}` });
        if (tx) {
          goto(`/blockexplorer/transaction/${trimmedInput}`);
          return;
        }
      } catch (error) {
        console.error('Failed to fetch transaction:', error);
        // If transaction not found, don't do anything - let user see the error
      }
    }
  }
</script>

<div class="w-full text-white">
  <form onsubmit={handleSearch} class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
    <Input
      class="flex-1 bg-card border-border text-white placeholder:text-white/50"
      style="min-width: 300px; max-width: 600px;"
      type="text"
      bind:value={searchInput}
      placeholder="Search by hash or address"
    />
    <Button type="submit" class="h-10 px-6 whitespace-nowrap bg-[var(--luke-primary)] text-black hover:bg-[var(--luke-primary)]/90">
      <svg xmlns="http://www.w3.org/2000/svg" class="size-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      Search
    </Button>
  </form>
</div>


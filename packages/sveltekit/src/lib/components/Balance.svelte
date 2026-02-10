<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { writable, get } from 'svelte/store';
  import type { Address } from 'viem';
  import { formatEther } from 'viem';
  import { getBalance, watchAccount } from '@wagmi/core';
  import { wagmiConfig } from '$lib/config/wagmi.js';
  import { targetNetwork } from '$lib/stores/targetNetwork.js';

  export let address: Address;
  export let style: string = '';

  const balance = writable<bigint | null>(null);
  const isLoading = writable(true);

  let unwatchAccount: (() => void) | undefined = undefined;
  let unsubscribeNetwork: (() => void) | undefined = undefined;

  async function fetchBalance() {
    if (!browser || !wagmiConfig) return;

    try {
      const $targetNetwork = get(targetNetwork);
      if (!address) return;
      
      const result = await getBalance(wagmiConfig, {
        address,
        chainId: $targetNetwork.id,
      });
      balance.set(result.value);
      isLoading.set(false);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      isLoading.set(false);
    }
  }

  onMount(() => {
    if (browser && wagmiConfig) {
      fetchBalance();

      // Watch for account changes
      unwatchAccount = watchAccount(wagmiConfig, {
        onChange(data) {
          if (data.address) {
          fetchBalance();
          }
        },
      });

      // Watch for network changes
      unsubscribeNetwork = targetNetwork.subscribe(() => {
        fetchBalance();
      });
    }
  });

  onDestroy(() => {
    unwatchAccount?.();
    unsubscribeNetwork?.();
  });

  function formatBalance(balance: bigint | null): string {
    if (balance === null) return '0.00';
    const ether = formatEther(balance);
    const num = parseFloat(ether);
    return num.toFixed(2);
  }
</script>

{#if $isLoading}
  <span class="text-foreground" style={style}>...</span>
{:else if $balance !== null}
  <span class="text-foreground font-medium" style={style}>{formatBalance($balance)} ETH</span>
{:else}
  <span class="text-foreground font-medium" style={style}>0.00 ETH</span>
{/if}


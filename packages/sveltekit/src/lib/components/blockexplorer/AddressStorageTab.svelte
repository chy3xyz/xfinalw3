<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import type { Address } from 'viem';
  import { getPublicClient } from '@wagmi/core';
  import { toHex } from 'viem';
  import { hardhat } from 'viem/chains';
  import { wagmiConfig } from '$lib/config/wagmi.js';

  export let address: Address;

  let storage: string[] = [];
  let loading = true;

  onMount(async () => {
    if (browser) {
      try {
        const publicClient = getPublicClient(wagmiConfig, { chainId: hardhat.id });
        const storageData: string[] = [];
        let idx = 0;

        while (true) {
          const storageAtPosition = await publicClient.getStorageAt({
            address,
            slot: toHex(idx),
          });

          if (storageAtPosition === '0x' + '0'.repeat(64)) break;

          if (storageAtPosition) {
            storageData.push(storageAtPosition);
          }

          idx++;
        }
        storage = storageData;
      } catch (error) {
        console.error('Failed to fetch storage:', error);
      } finally {
        loading = false;
      }
    }
  });
</script>

<div class="flex flex-col gap-3 p-4">
  {#if loading}
    <div class="text-lg">Loading storage...</div>
  {:else if storage.length > 0}
    <div class="bg-muted border border-border rounded-lg overflow-auto max-h-[500px]">
      <pre class="px-5 py-4 m-0 whitespace-pre-wrap break-words text-sm">
        {#each storage as data, i}
          <div>
            <strong>Storage Slot {i}:</strong> {data}
          </div>
        {/each}
      </pre>
    </div>
  {:else}
    <div class="text-lg">This contract does not have any variables.</div>
  {/if}
</div>


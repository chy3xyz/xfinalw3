<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { createFetchBlocksStore } from '$lib/stores/fetchBlocks.js';
  import { useTargetNetwork } from '$lib/stores/targetNetwork.js';
  import { hardhat } from 'viem/chains';
  import { notification } from '$lib/utils/notification.js';
  import SearchBar from '$lib/components/blockexplorer/SearchBar.svelte';
  import TransactionsTable from '$lib/components/blockexplorer/TransactionsTable.svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
  import { Skeleton } from '$lib/components/ui/skeleton';

  let targetNetworkStore: ReturnType<typeof useTargetNetwork> | null = null;
  let blocksStore: ReturnType<typeof createFetchBlocksStore> | null = null;
  
  // Extract individual stores (only in browser)
  let blocks: ReturnType<typeof createFetchBlocksStore>['blocks'] | null = null;
  let transactionReceipts: ReturnType<typeof createFetchBlocksStore>['transactionReceipts'] | null = null;
  let currentPage: ReturnType<typeof createFetchBlocksStore>['currentPage'] | null = null;
  let totalBlocks: ReturnType<typeof createFetchBlocksStore>['totalBlocks'] | null = null;
  let error: ReturnType<typeof createFetchBlocksStore>['error'] | null = null;
  
  let targetNetworkValue: any = null;
  let isLocalNetwork = true;
  let hasError = false;
  let unsubscribeNetwork: (() => void) | null = null;

  // Initialize stores only in browser to avoid SSR issues
  onMount(() => {
    if (browser) {
      targetNetworkStore = useTargetNetwork();
      blocksStore = createFetchBlocksStore();
      
      blocks = blocksStore.blocks;
      transactionReceipts = blocksStore.transactionReceipts;
      currentPage = blocksStore.currentPage;
      totalBlocks = blocksStore.totalBlocks;
      error = blocksStore.error;
      
      // Subscribe to target network
      if (targetNetworkStore) {
        unsubscribeNetwork = targetNetworkStore.targetNetwork.subscribe((value) => {
          targetNetworkValue = value;
          if (value && 'id' in value) {
            isLocalNetwork = value.id === hardhat.id;
          }
        });
      }
      
      // Fetch blocks after initialization
      if (blocksStore) {
        blocksStore.fetchBlocks();
      }
    }
  });


  onDestroy(() => {
    if (browser) {
      if (unsubscribeNetwork) {
        unsubscribeNetwork();
      }
      if (blocksStore) {
        blocksStore.unwatch?.();
      }
    }
  });

  $: if (browser && targetNetworkValue && !isLocalNetwork) {
    const network = targetNetworkValue;
    if (network && 'name' in network) {
      notification.error(
        `targetNetwork is not localhost. You are on ${network.name}. This block explorer is only for localhost.`,
      );
    }
  }

  $: if (browser && targetNetworkValue && error) {
    const network = targetNetworkValue;
    const err = $error;
    if (network && 'id' in network && network.id === hardhat.id && err) {
      hasError = true;
    }
  }

  $: if (browser && hasError) {
    notification.error('Cannot connect to local provider. Did you forget to run `bun chain`?');
  }
</script>

<div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 max-w-7xl">
  {#if browser && blocks && transactionReceipts && currentPage && totalBlocks}
    {@const blocksValue = $blocks}
    {@const receiptsValue = $transactionReceipts}
    {@const currentPageValue = $currentPage}
    {@const totalBlocksValue = $totalBlocks}
    {#if blocksValue && receiptsValue && currentPageValue !== null && totalBlocksValue !== null}
      <Card class="mb-6 border-border bg-card/95">
        <CardHeader>
          <CardTitle class="text-2xl sm:text-3xl text-white">Block Explorer</CardTitle>
          <p class="text-sm text-white/80 mt-1">Explore transactions on your local blockchain</p>
        </CardHeader>
      </Card>
      <Card class="mb-6 border-border bg-card/95">
        <CardContent class="pt-6">
          <SearchBar />
        </CardContent>
      </Card>
      <Card class="mb-6 border-border bg-card/95 overflow-hidden">
        <CardContent class="p-0">
          <TransactionsTable blocks={blocksValue} transactionReceipts={receiptsValue} />
        </CardContent>
      </Card>
    {:else}
      <div class="flex flex-col gap-4 max-w-2xl">
        <Skeleton class="h-10 w-full max-w-md" />
        <Skeleton class="h-64 w-full" />
        <Skeleton class="h-10 w-48" />
      </div>
    {/if}
  {:else}
    <div class="flex flex-col gap-4 max-w-2xl">
      <Skeleton class="h-10 w-full max-w-md" />
      <Skeleton class="h-64 w-full" />
      <Skeleton class="h-10 w-48" />
    </div>
  {/if}
</div>

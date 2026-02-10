<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { formatEther } from 'viem';
  import { hardhat } from 'viem/chains';
  import { useTargetNetwork } from '$lib/stores/targetNetwork.js';
  import Address from '$lib/components/Address.svelte';
  import TransactionHash from './TransactionHash.svelte';
  import PaginationButton from './PaginationButton.svelte';
  import type { Block, TransactionReceipt, Transaction } from 'viem';

  export let blocks: Block[];
  export let transactionReceipts: { [key: string]: TransactionReceipt };

  let targetNetworkStore: ReturnType<typeof useTargetNetwork> | null = null;
  let targetNetworkValue: ReturnType<typeof useTargetNetwork>['targetNetwork'] | null = null;

  // Pagination
  const ITEMS_PER_PAGE = 10;
  let currentPage = 1;

  // Initialize network store only in browser to avoid SSR issues
  onMount(() => {
    if (browser) {
      targetNetworkStore = useTargetNetwork();
      targetNetworkValue = targetNetworkStore.targetNetwork;
    }
  });

  // Flatten all transactions from blocks
  $: allTransactions = blocks.flatMap(block => 
    block.transactions.map(tx => ({
      tx: typeof tx === 'string' ? null : tx as Transaction,
      block,
      hash: typeof tx === 'string' ? tx : tx.hash,
    }))
  ).filter(item => item.tx !== null);

  $: totalPages = Math.ceil(allTransactions.length / ITEMS_PER_PAGE);
  
  $: paginatedTransactions = allTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  function handlePageChange(page: number) {
    currentPage = page + 1;
  }

  function getTimeMined(timestamp: bigint): string {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  }

  function getFunctionCalled(input: string): string {
    return input.substring(0, 10);
  }

  function getNetworkSymbol(): string {
    if (!browser || !targetNetworkValue) return 'ETH';
    const network = $targetNetworkValue as any;
    return network?.nativeCurrency?.symbol || 'ETH';
  }

  function getBlockExplorerLink(to: string): string | undefined {
    if (!browser || !targetNetworkValue) return undefined;
    const network = $targetNetworkValue as any;
    return network && network.id === hardhat.id ? `/blockexplorer/address/${to}` : undefined;
  }
</script>

<div class="flex flex-col gap-4 px-4 md:px-0 text-white">
  <!-- Stats -->
  <div class="flex items-center justify-between text-sm text-white/70">
    <span>Total Transactions: {allTransactions.length}</span>
    {#if totalPages > 1}
      <span>Page {currentPage} of {totalPages}</span>
    {/if}
  </div>

  <!-- Table -->
  <div class="overflow-x-auto w-full shadow-2xl rounded-xl">
    <table class="table text-xl bg-card border border-border w-full md:table-md table-sm text-white">
      <thead>
        <tr class="rounded-xl text-sm">
          <th class="bg-[var(--luke-primary)] text-black font-semibold">Transaction Hash</th>
          <th class="bg-[var(--luke-primary)] text-black font-semibold">Function Called</th>
          <th class="bg-[var(--luke-primary)] text-black font-semibold">Block Number</th>
          <th class="bg-[var(--luke-primary)] text-black font-semibold">Time Mined</th>
          <th class="bg-[var(--luke-primary)] text-black font-semibold">From</th>
          <th class="bg-[var(--luke-primary)] text-black font-semibold">To</th>
          <th class="bg-[var(--luke-primary)] text-black font-semibold text-end">Value {getNetworkSymbol()}</th>
        </tr>
      </thead>
      <tbody class="text-white/95">
        {#each paginatedTransactions as { tx: txObj, block, hash }}
          {@const receipt = transactionReceipts[hash]}
          {@const timeMined = getTimeMined(block.timestamp)}
          {@const functionCalled = txObj ? getFunctionCalled(txObj.input) : '0x'}
          <tr class="hover text-sm">
            <td class="w-1/12 md:py-4">
              <TransactionHash hash={hash} />
            </td>
            <td class="w-2/12 md:py-4">
              {#if functionCalled !== '0x'}
                <span class="inline-flex items-center rounded-full bg-primary text-primary-foreground px-2 py-1 text-xs font-bold">{functionCalled}</span>
              {/if}
            </td>
            <td class="w-1/12 md:py-4">{block.number?.toString()}</td>
            <td class="w-2/12 md:py-4">{timeMined}</td>
            <td class="w-2/12 md:py-4">
              {#if txObj}
                <Address address={txObj.from} size="sm" />
              {/if}
            </td>
            <td class="w-2/12 md:py-4">
              {#if txObj}
                {#if txObj.to}
                  <Address
                    address={txObj.to}
                    size="sm"
                    blockExplorerAddressLink={getBlockExplorerLink(txObj.to)}
                  />
                {:else}
                  <span class="text-white/70">Contract Creation</span>
                {/if}
              {/if}
            </td>
            <td class="text-end md:py-4">
              {#if txObj}
                {formatEther(txObj.value)}
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Pagination -->
  {#if totalPages > 1}
    <div class="flex justify-center mt-4">
      <PaginationButton
        currentPage={currentPage - 1}
        totalItems={allTransactions.length}
        itemsPerPage={ITEMS_PER_PAGE}
        setCurrentPage={handlePageChange}
      />
    </div>
  {/if}
</div>

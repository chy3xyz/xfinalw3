<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import type { Address } from 'viem';
  import { getPublicClient } from '@wagmi/core';
  import { hardhat } from 'viem/chains';
  import { wagmiConfig } from '$lib/config/wagmi.js';
  import { createFetchBlocksStore } from '$lib/stores/fetchBlocks.js';
  import AddressCodeTab from './AddressCodeTab.svelte';
  import AddressLogsTab from './AddressLogsTab.svelte';
  import AddressStorageTab from './AddressStorageTab.svelte';
  import PaginationButton from './PaginationButton.svelte';
  import TransactionsTable from './TransactionsTable.svelte';

  export let address: Address;
  export let contractData: { bytecode: string; assembly: string } | null;

  let activeTab = 'transactions';
  let isContract = false;
  let blocksStore: ReturnType<typeof createFetchBlocksStore> | null = null;
  let blocks: ReturnType<typeof createFetchBlocksStore>['blocks'] | null = null;
  let transactionReceipts: ReturnType<typeof createFetchBlocksStore>['transactionReceipts'] | null = null;
  let currentPage: ReturnType<typeof createFetchBlocksStore>['currentPage'] | null = null;
  let totalBlocks: ReturnType<typeof createFetchBlocksStore>['totalBlocks'] | null = null;

  onMount(() => {
    if (browser) {
      // Check if address is a contract
      const checkIsContract = async () => {
        try {
          const publicClient = getPublicClient(wagmiConfig, { chainId: hardhat.id });
          const contractCode = await publicClient.getBytecode({ address });
          isContract = contractCode !== undefined && contractCode !== '0x';
        } catch (error) {
          console.error('Failed to check if contract:', error);
          isContract = false;
        }
      };

      checkIsContract();

      // Initialize blocks store
      blocksStore = createFetchBlocksStore();
      blocks = blocksStore.blocks;
      transactionReceipts = blocksStore.transactionReceipts;
      currentPage = blocksStore.currentPage;
      totalBlocks = blocksStore.totalBlocks;

      blocksStore.fetchBlocks();
    }
  });

  $: filteredBlocks = $blocks?.filter((block) =>
    block.transactions.some((tx) => {
      if (typeof tx === 'string') {
        return false;
      }
      return tx.from.toLowerCase() === address.toLowerCase() || tx.to?.toLowerCase() === address.toLowerCase();
    }),
  ) || [];
</script>

{#if isContract}
  <div role="tablist" class="flex border-b border-border mb-4 text-white">
    <button
      type="button"
      role="tab"
      class="px-4 py-2 border-b-2 transition-colors {activeTab === 'transactions' ? 'border-[var(--luke-primary)] text-[var(--luke-primary)] font-semibold' : 'border-transparent text-white/80 hover:text-white'}"
      onclick={() => (activeTab = 'transactions')}
    >
      Transactions
    </button>
    <button
      type="button"
      role="tab"
      class="px-4 py-2 border-b-2 transition-colors {activeTab === 'code' ? 'border-[var(--luke-primary)] text-[var(--luke-primary)] font-semibold' : 'border-transparent text-white/80 hover:text-white'}"
      onclick={() => (activeTab = 'code')}
    >
      Code
    </button>
    <button
      type="button"
      role="tab"
      class="px-4 py-2 border-b-2 transition-colors {activeTab === 'storage' ? 'border-[var(--luke-primary)] text-[var(--luke-primary)] font-semibold' : 'border-transparent text-white/80 hover:text-white'}"
      onclick={() => (activeTab = 'storage')}
    >
      Storage
    </button>
    <button
      type="button"
      role="tab"
      class="px-4 py-2 border-b-2 transition-colors {activeTab === 'logs' ? 'border-[var(--luke-primary)] text-[var(--luke-primary)] font-semibold' : 'border-transparent text-white/80 hover:text-white'}"
      onclick={() => (activeTab = 'logs')}
    >
      Logs
    </button>
  </div>
{/if}

{#if activeTab === 'transactions' && blocks && transactionReceipts && currentPage && totalBlocks}
  <div class="pt-4">
    <TransactionsTable blocks={filteredBlocks} transactionReceipts={$transactionReceipts} />
    <PaginationButton
      currentPage={$currentPage}
      totalItems={Number($totalBlocks)}
      setCurrentPage={(page: number) => currentPage?.set(page)}
    />
  </div>
{/if}

{#if activeTab === 'code' && contractData}
  <AddressCodeTab bytecode={contractData.bytecode} assembly={contractData.assembly} />
{/if}

{#if activeTab === 'storage'}
  <AddressStorageTab {address} />
{/if}

{#if activeTab === 'logs'}
  <AddressLogsTab {address} />
{/if}


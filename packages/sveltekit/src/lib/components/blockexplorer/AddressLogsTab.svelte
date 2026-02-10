<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { get } from 'svelte/store';
  import type { Address, Log } from 'viem';
  import { createContractLogsStore } from '$lib/stores/contractLogs.js';
  import PaginationButton from './PaginationButton.svelte';
  import { Card } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { formatEther } from 'viem';

  export let address: Address;

  let logsStore: ReturnType<typeof createContractLogsStore> | null = null;
  let logs: Log[] = [];
  let unsubscribeLogs: (() => void) | null = null;
  
  // Pagination
  const ITEMS_PER_PAGE = 10;
  let currentPage = 1;
  
  $: totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);
  $: paginatedLogs = logs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  function handlePageChange(page: number) {
    // PaginationButton uses 0-based index, convert to 1-based
    currentPage = page + 1;
  }
  
  // Format log data compactly
  function formatLogData(data: string): string {
    if (!data || data === '0x') return '0x';
    if (data.length <= 10) return data;
    return `${data.slice(0, 6)}...${data.slice(-4)}`;
  }
  
  // Format topics compactly
  function formatTopic(topic: string): string {
    if (!topic) return '';
    if (topic.length <= 10) return topic;
    return `${topic.slice(0, 6)}...${topic.slice(-4)}`;
  }
  
  // Get event signature from first topic
  function getEventSignature(log: Log): string {
    if (!log.topics || log.topics.length === 0) return 'Unknown';
    const eventTopic = log.topics[0];
    // Common event signatures
    const commonEvents: Record<string, string> = {
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef': 'Transfer',
      '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925': 'Approval',
      '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c': 'Deposit',
      '0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65': 'Withdrawal',
    };
    return commonEvents[eventTopic] || formatTopic(eventTopic);
  }
  
  // Format value if present in data
  function formatValue(log: Log): string {
    if (!log.data || log.data === '0x') return '';
    try {
      // Try to parse as ether value
      const value = BigInt(log.data);
      if (value > 0n) {
        return formatEther(value).slice(0, 10) + ' ETH';
      }
    } catch {
      // Not a valid bigint, return formatted data
    }
    return formatLogData(log.data);
  }

  onMount(() => {
    if (browser) {
      logsStore = createContractLogsStore(address);
      if (logsStore) {
        unsubscribeLogs = logsStore.logs.subscribe((value) => {
          logs = value;
          // Reset to first page when logs change
          currentPage = 1;
        });
      }
    }
  });

  onDestroy(() => {
    unsubscribeLogs?.();
    if (logsStore) {
      logsStore.unwatch();
    }
  });
</script>

<div class="flex flex-col gap-4">
  {#if logsStore}
    {#if logs && logs.length > 0}
      <!-- Stats -->
      <div class="flex items-center justify-between text-sm text-white/70">
        <span>Total Logs: {logs.length}</span>
        <span>Page {currentPage} of {totalPages}</span>
      </div>
      
      <!-- Compact Logs Table -->
      <Card class="border-border bg-card/95 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border bg-muted/50">
                <th class="px-3 py-2 text-left text-xs font-medium text-white/70">Block</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-white/70">Tx Hash</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-white/70">Event</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-white/70">Topics</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-white/70">Data</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              {#each paginatedLogs as log}
                <tr class="hover:bg-muted/30 transition-colors">
                  <td class="px-3 py-2 whitespace-nowrap">
                    <span class="font-mono text-xs text-white/90">{log.blockNumber?.toString() || '-'}</span>
                  </td>
                  <td class="px-3 py-2 whitespace-nowrap">
                    <a 
                      href={`/blockexplorer/transaction/${log.transactionHash}`}
                      class="font-mono text-xs text-[var(--luke-primary)] hover:underline"
                    >
                      {formatTopic(log.transactionHash)}
                    </a>
                  </td>
                  <td class="px-3 py-2 whitespace-nowrap">
                    <Badge variant="secondary" class="text-xs">
                      {getEventSignature(log)}
                    </Badge>
                  </td>
                  <td class="px-3 py-2 whitespace-nowrap">
                    <div class="flex flex-col gap-0.5">
                      {#each log.topics.slice(1) as topic}
                        <span class="font-mono text-xs text-white/70">{formatTopic(topic)}</span>
                      {/each}
                      {#if log.topics.length <= 1}
                        <span class="text-xs text-white/40">-</span>
                      {/if}
                    </div>
                  </td>
                  <td class="px-3 py-2 whitespace-nowrap">
                    {#if log.data && log.data !== '0x'}
                      <span class="font-mono text-xs text-white/90" title={log.data}>
                        {formatValue(log)}
                      </span>
                    {:else}
                      <span class="text-xs text-white/40">-</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </Card>
      
      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="flex justify-center">
          <PaginationButton
            currentPage={currentPage - 1}
            totalItems={logs.length}
            itemsPerPage={ITEMS_PER_PAGE}
            setCurrentPage={handlePageChange}
          />
        </div>
      {/if}
    {:else}
      <Card class="border-border bg-card/95 p-6">
        <p class="text-center text-white/70">No logs found for this address.</p>
      </Card>
    {/if}
  {:else}
    <Card class="border-border bg-card/95 p-6">
      <p class="text-center text-white/70">Loading logs...</p>
    </Card>
  {/if}
</div>

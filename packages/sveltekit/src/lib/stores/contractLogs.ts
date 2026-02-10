import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { getPublicClient } from '@wagmi/core';
import { useTargetNetwork } from './targetNetwork.js';
import { wagmiConfig } from '../config/wagmi.js';
import type { Address, Log } from 'viem';

/**
 * Fetches and watches contract logs for a given address
 */
export function createContractLogsStore(address: Address) {
  const logs = writable<Log[]>([]);
  const { targetNetwork } = useTargetNetwork();

  const fetchLogs = async () => {
    if (!browser) return;
    
    const $targetNetwork = get(targetNetwork);
    const client = getPublicClient(wagmiConfig, { chainId: $targetNetwork.id });
    
    if (!client) {
      console.error('Client not found');
      return;
    }

    try {
      // Optimize: If block number is available, fetch only recent logs or paginate
      // For now, we'll fetch recent 1000 blocks (optimized from 10000)
      const blockNumber = await client.getBlockNumber();
      const fromBlock = blockNumber > 1000n ? blockNumber - 1000n : 0n;
      
      const existingLogs = await client.getLogs({
        address: address,
        fromBlock: fromBlock,
        toBlock: 'latest',
      });
      logs.set(existingLogs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  let unwatch: (() => void) | undefined;

  if (browser) {
    fetchLogs();

    const $targetNetwork = get(targetNetwork);
    const client = getPublicClient(wagmiConfig, { chainId: $targetNetwork.id });
    
    if (client) {
      unwatch = client.watchBlockNumber({
        onBlockNumber: async (_blockNumber, prevBlockNumber) => {
          const $targetNetwork = get(targetNetwork);
          const client = getPublicClient(wagmiConfig, { chainId: $targetNetwork.id });
          if (!client) return;

          try {
            const newLogs = await client.getLogs({
              address: address,
              fromBlock: prevBlockNumber,
              toBlock: 'latest',
            });
            logs.update((prevLogs) => [...prevLogs, ...newLogs]);
          } catch (error) {
            console.error('Failed to fetch new logs:', error);
          }
        },
      });
    }
  }

  // Note: onDestroy should be called in the component using this store
  // This is a limitation - we can't use onDestroy here directly
  // The component should handle cleanup

  return {
    logs: { subscribe: logs.subscribe },
    refetch: fetchLogs,
    unwatch: () => unwatch?.(),
  };
}


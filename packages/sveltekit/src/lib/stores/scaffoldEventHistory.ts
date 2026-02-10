import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { useInfiniteQuery, useQuery } from '@tanstack/svelte-query';
import { useBlockNumber, usePublicClient } from 'wagmi';
import { hardhat } from 'viem/chains';
import { useSelectedNetwork } from './selectedNetwork.js';
import { createDeployedContractStore } from './deployedContract.js';
import type { ExtractAbiEventNames } from 'abitype';
import type { Abi, AbiEvent, BlockNumber, GetLogsParameters, Log } from 'viem';
import type { Config, UsePublicClientReturnType } from 'wagmi';
import type {
  ContractAbi,
  ContractName,
  UseScaffoldEventHistoryConfig,
  UseScaffoldEventHistoryData,
} from '../utils/contract.js';
import type { AllowedChainIds } from '../utils/networks.js';
import { replacer } from '../utils/common.js';

const getEvents = async (
  getLogsParams: GetLogsParameters<AbiEvent | undefined, AbiEvent[] | undefined, boolean, BlockNumber, BlockNumber>,
  publicClient?: UsePublicClientReturnType<Config, number>,
  Options?: {
    blockData?: boolean;
    transactionData?: boolean;
    receiptData?: boolean;
  },
) => {
  if (!publicClient) return undefined;
  
  const logs = await publicClient.getLogs({
    address: getLogsParams.address,
    fromBlock: getLogsParams.fromBlock,
    toBlock: getLogsParams.toBlock,
    args: getLogsParams.args,
    event: getLogsParams.event,
  });
  if (!logs) return undefined;

  const finalEvents = await Promise.all(
    logs.map(async log => {
      return {
        ...log,
        blockData:
          Options?.blockData && log.blockHash ? await publicClient.getBlock({ blockHash: log.blockHash }) : null,
        transactionData:
          Options?.transactionData && log.transactionHash
            ? await publicClient.getTransaction({ hash: log.transactionHash })
            : null,
        receiptData:
          Options?.receiptData && log.transactionHash
            ? await publicClient.getTransactionReceipt({ hash: log.transactionHash })
            : null,
      };
    }),
  );

  return finalEvents;
};

/**
 * @deprecated **Recommended only for local (hardhat/anvil) chains and development.**
 * It uses getLogs which can overload RPC endpoints (especially on L2s with short block times).
 * For production, use an indexer such as ponder.sh or similar to query contract events efficiently.
 *
 * Reads events from a deployed contract.
 */
export function createScaffoldEventHistoryStore<
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
  TBlockData extends boolean = false,
  TTransactionData extends boolean = false,
  TReceiptData extends boolean = false,
>(config: UseScaffoldEventHistoryConfig<TContractName, TEventName, TBlockData, TTransactionData, TReceiptData>) {
  const {
    contractName,
    eventName,
    fromBlock,
    toBlock,
    chainId,
    filters,
    blockData,
    transactionData,
    receiptData,
    watch,
    enabled = true,
    blocksBatchSize = 500,
  } = config;

  const selectedNetwork = useSelectedNetwork(chainId);
  const publicClient = usePublicClient({ chainId: get(selectedNetwork).id });
  const liveEvents = writable<any[]>([]);
  const lastFetchedBlock = writable<bigint | null>(null);
  const isPollingActive = writable(false);

  const { data: blockNumber } = useBlockNumber({ watch: watch, chainId: get(selectedNetwork).id });

  const deployedContractStore = createDeployedContractStore({
    contractName,
    chainId: get(selectedNetwork).id as AllowedChainIds,
  });

  const deployedContractData = derived(deployedContractStore, ($deployedContract) => $deployedContract.data);

  const event = derived(deployedContractData, ($deployedContract) => {
    if (!$deployedContract) return undefined;
    return ($deployedContract.abi as Abi).find(
      part => part.type === 'event' && part.name === eventName,
    ) as AbiEvent | undefined;
  });

  const isContractAddressAndClientReady = derived(
    [deployedContractData, publicClient],
    ([$deployedContract, $publicClient]) => Boolean($deployedContract?.address) && Boolean($publicClient),
  );

  const fromBlockValue = derived([deployedContractData], ([$deployedContract]) => {
    if (fromBlock !== undefined) return fromBlock;
    return BigInt(
      $deployedContract && 'deployedOnBlock' in $deployedContract ? $deployedContract.deployedOnBlock || 0 : 0,
    );
  });

  const query = useInfiniteQuery({
    queryKey: [
      'eventHistory',
      {
        contractName,
        address: get(deployedContractData)?.address,
        eventName,
        fromBlock: get(fromBlockValue)?.toString(),
        toBlock: toBlock?.toString(),
        chainId: get(selectedNetwork).id,
        filters: JSON.stringify(filters, replacer),
        blocksBatchSize: blocksBatchSize.toString(),
      },
    ],
    queryFn: async ({ pageParam }) => {
      const $isReady = get(isContractAddressAndClientReady);
      const $deployedContract = get(deployedContractData);
      const $publicClient = get(publicClient);
      const $event = get(event);
      const $blockNumber = get(blockNumber);
      const $fromBlock = get(fromBlockValue);

      if (!$isReady || !$deployedContract || !$publicClient || !$event) return undefined;

      // Calculate the toBlock for this batch
      let batchToBlock = toBlock;
      const batchEndBlock = pageParam + BigInt(blocksBatchSize) - 1n;
      const maxBlock = toBlock || ($blockNumber?.data ? BigInt($blockNumber.data) : undefined);
      if (maxBlock) {
        batchToBlock = batchEndBlock < maxBlock ? batchEndBlock : maxBlock;
      }

      const data = await getEvents(
        {
          address: $deployedContract.address,
          event: $event,
          fromBlock: pageParam,
          toBlock: batchToBlock,
          args: filters,
        },
        $publicClient,
        { blockData, transactionData, receiptData },
      );

      const $lastFetched = get(lastFetchedBlock);
      lastFetchedBlock.set(batchToBlock || $blockNumber?.data || 0n);

      return data;
    },
    enabled: enabled && get(isContractAddressAndClientReady) && !get(isPollingActive),
    initialPageParam: get(fromBlockValue),
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      const $blockNumber = get(blockNumber);
      const $fromBlock = get(fromBlockValue);
      if (!$blockNumber?.data || $fromBlock >= $blockNumber.data) return undefined;

      const nextBlock = lastPageParam + BigInt(blocksBatchSize);

      // Don't go beyond the specified toBlock or current block
      const maxBlock = toBlock && toBlock < $blockNumber.data ? toBlock : $blockNumber.data;

      if (nextBlock > maxBlock) return undefined;

      return nextBlock;
    },
    select: data => {
      const events = data.pages.flat() as unknown as UseScaffoldEventHistoryData<
        TContractName,
        TEventName,
        TBlockData,
        TTransactionData,
        TReceiptData
      >;

      return {
        pages: events?.reverse(),
        pageParams: data.pageParams,
      };
    },
  });

  // Check if we're caught up and should start polling
  const shouldStartPolling = derived([query, blockNumber, isPollingActive], ([$query, $blockNumber, $isPollingActive]) => {
    if (!watch || !$blockNumber?.data || $isPollingActive) return false;
    return !$query.hasNextPage && $query.status === 'success';
  });

  // Poll for new events when watch mode is enabled
  useQuery({
    queryKey: [
      'liveEvents',
      contractName,
      eventName,
      get(blockNumber)?.data?.toString(),
      get(lastFetchedBlock)?.toString(),
    ],
    enabled: Boolean(
      watch &&
        enabled &&
        get(isContractAddressAndClientReady) &&
        get(blockNumber)?.data &&
        (get(shouldStartPolling) || get(isPollingActive)),
    ),
    queryFn: async () => {
      const $isReady = get(isContractAddressAndClientReady);
      const $blockNumber = get(blockNumber);
      const $deployedContract = get(deployedContractData);
      const $publicClient = get(publicClient);
      const $event = get(event);
      const $lastFetched = get(lastFetchedBlock);

      if (!$isReady || !$blockNumber?.data || !$deployedContract || !$publicClient || !$event) return null;

      if (!get(isPollingActive) && get(shouldStartPolling)) {
        isPollingActive.set(true);
      }

      const maxBlock = toBlock && toBlock < $blockNumber.data ? toBlock : $blockNumber.data;
      const startBlock = $lastFetched || maxBlock;

      // Only fetch if there are new blocks to check
      if (startBlock >= maxBlock) return null;

      const newEvents = await getEvents(
        {
          address: $deployedContract.address,
          event: $event,
          fromBlock: startBlock + 1n,
          toBlock: maxBlock,
          args: filters,
        },
        $publicClient,
        { blockData, transactionData, receiptData },
      );

      if (newEvents && newEvents.length > 0) {
        liveEvents.update(prev => [...newEvents, ...prev]);
      }

      lastFetchedBlock.set(maxBlock);
      return newEvents;
    },
    refetchInterval: false,
  });

  // Manual trigger to fetch next page when previous page completes (only when not polling)
  derived([query, isPollingActive], ([$query, $isPollingActive]) => {
    if (
      !$isPollingActive &&
      $query.status === 'success' &&
      $query.hasNextPage &&
      !$query.isFetchingNextPage &&
      !$query.error
    ) {
      $query.fetchNextPage();
    }
  });

  // Combine historical data from infinite query with live events from watch hook
  const combinedEvents = derived([query, liveEvents], ([$query, $liveEvents]) => {
    const historicalEvents = $query.data?.pages || [];
    const allEvents = [...$liveEvents, ...historicalEvents];

    // remove duplicates
    const seenEvents = new Set<string>();
    return allEvents.filter(event => {
      const eventKey = `${event?.transactionHash}-${event?.logIndex}-${event?.blockHash}`;
      if (seenEvents.has(eventKey)) {
        return false;
      }
      seenEvents.add(eventKey);
      return true;
    }) as typeof historicalEvents;
  });

  // Runtime warning for non-local chains
  derived([selectedNetwork], ([$selectedNetwork]) => {
    if ($selectedNetwork.id !== hardhat.id && browser) {
      console.log(
        '⚠️ useScaffoldEventHistory is not optimized for production use. It can overload RPC endpoints (especially on L2s)',
      );
    }
  });

  return {
    data: combinedEvents,
    status: derived(query, $query => $query.status),
    error: derived(query, $query => $query.error),
    isLoading: derived(query, $query => $query.isLoading),
    isFetchingNewEvent: derived(query, $query => $query.isFetchingNextPage),
    refetch: () => query.refetch(),
  };
}


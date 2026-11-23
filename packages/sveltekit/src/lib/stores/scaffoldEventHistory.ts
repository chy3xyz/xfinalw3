import { browser } from "$app/env"
import { getBlockNumber, getPublicClient, watchBlockNumber } from "@wagmi/core"
import type { ExtractAbiEventNames } from "abitype"
import { get, writable } from "svelte/store"
import type { PublicClient } from "viem"
import type { Abi, AbiEvent, BlockNumber, GetLogsParameters } from "viem"
import { hardhat } from "viem/chains"
import { wagmiContextStore } from "../contexts/wagmi.js"
import type {
  ContractAbi,
  ContractName,
  UseScaffoldEventHistoryConfig,
  UseScaffoldEventHistoryData
} from "../utils/contract.js"
import type { AllowedChainIds } from "../utils/networks.js"
import { createDeployedContractStore } from "./deployedContract.js"
import { useSelectedNetwork } from "./selectedNetwork.js"

const getEvents = async (
  getLogsParams: GetLogsParameters<
    AbiEvent | undefined,
    AbiEvent[] | undefined,
    boolean,
    BlockNumber,
    BlockNumber
  >,
  publicClient?: PublicClient | null,
  Options?: {
    blockData?: boolean
    transactionData?: boolean
    receiptData?: boolean
  }
) => {
  if (!publicClient) return undefined

  const logs = await publicClient.getLogs({
    address: getLogsParams.address,
    fromBlock: getLogsParams.fromBlock,
    toBlock: getLogsParams.toBlock,
    args: getLogsParams.args,
    event: getLogsParams.event
  })
  if (!logs) return undefined

  const finalEvents = await Promise.all(
    logs.map(async (log) => {
      return {
        ...log,
        blockData:
          Options?.blockData && log.blockHash
            ? await publicClient.getBlock({ blockHash: log.blockHash })
            : null,
        transactionData:
          Options?.transactionData && log.transactionHash
            ? await publicClient.getTransaction({ hash: log.transactionHash })
            : null,
        receiptData:
          Options?.receiptData && log.transactionHash
            ? await publicClient.getTransactionReceipt({
                hash: log.transactionHash
              })
            : null
      }
    })
  )

  return finalEvents
}

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
  TReceiptData extends boolean = false
>(
  config: UseScaffoldEventHistoryConfig<
    TContractName,
    TEventName,
    TBlockData,
    TTransactionData,
    TReceiptData
  >
) {
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
    blocksBatchSize = 500
  } = config

  const selectedNetwork = useSelectedNetwork(chainId)
  const deployedContractStore = createDeployedContractStore({
    contractName,
    chainId: get(selectedNetwork).id as AllowedChainIds
  })

  type EventItem = UseScaffoldEventHistoryData<
    TContractName,
    TEventName,
    TBlockData,
    TTransactionData,
    TReceiptData
  > extends (infer U)[]
    ? U
    : any

  const eventsStore = writable<EventItem[]>([])
  const statusStore = writable<"pending" | "error" | "success">("pending")
  const errorStore = writable<unknown>(null)
  const isLoadingStore = writable(true)
  const isFetchingNewEventStore = writable(false)

  let lastFetchedBlock: bigint | null = null
  let warned = false

  const refetch = async () => {
    if (!browser || !enabled) {
      isLoadingStore.set(false)
      statusStore.set("success")
      return
    }

    const { config: wagmiConfig } = get(wagmiContextStore)
    const network = get(selectedNetwork)
    const deployed = get(deployedContractStore)?.data

    if (network.id !== hardhat.id && !warned) {
      warned = true
      console.log(
        "⚠️ useScaffoldEventHistory is not optimized for production use. It can overload RPC endpoints (especially on L2s)"
      )
    }

    if (!wagmiConfig || !deployed?.address || !deployed?.abi) {
      eventsStore.set([])
      isLoadingStore.set(false)
      statusStore.set("success")
      return
    }

    const publicClient = getPublicClient(wagmiConfig, {
      chainId: network.id
    }) as PublicClient | undefined
    if (!publicClient) {
      eventsStore.set([])
      isLoadingStore.set(false)
      statusStore.set("success")
      return
    }

    const event = (deployed.abi as Abi).find(
      (part) => part.type === "event" && part.name === eventName
    ) as AbiEvent | undefined
    if (!event) {
      eventsStore.set([])
      isLoadingStore.set(false)
      statusStore.set("success")
      return
    }

    const fromBlockValue =
      fromBlock !== undefined
        ? fromBlock
        : BigInt(
            "deployedOnBlock" in deployed
              ? (deployed as any).deployedOnBlock || 0
              : 0
          )

    try {
      isLoadingStore.set(true)
      statusStore.set("pending")
      errorStore.set(null)

      const currentBlock = await getBlockNumber(wagmiConfig, {
        chainId: network.id
      })
      const maxBlock =
        toBlock !== undefined && toBlock < currentBlock ? toBlock : currentBlock

      const allEvents: EventItem[] = []
      let pageParam = fromBlockValue

      while (pageParam <= maxBlock) {
        isFetchingNewEventStore.set(true)
        const batchEndBlock = pageParam + BigInt(blocksBatchSize) - 1n
        const batchToBlock = batchEndBlock < maxBlock ? batchEndBlock : maxBlock

        const batch = await getEvents(
          {
            address: deployed.address,
            event,
            fromBlock: pageParam,
            toBlock: batchToBlock,
            args: filters
          },
          publicClient,
          { blockData, transactionData, receiptData }
        )

        if (batch) {
          allEvents.push(...(batch as EventItem[]))
        }

        lastFetchedBlock = batchToBlock
        pageParam = batchToBlock + 1n
      }

      // newest first
      eventsStore.set([...allEvents].reverse())
      statusStore.set("success")
    } catch (error) {
      errorStore.set(error)
      statusStore.set("error")
    } finally {
      isLoadingStore.set(false)
      isFetchingNewEventStore.set(false)
    }
  }

  const pollNewEvents = async () => {
    if (!browser || !enabled || !watch) return

    const { config: wagmiConfig } = get(wagmiContextStore)
    const network = get(selectedNetwork)
    const deployed = get(deployedContractStore)?.data
    if (
      !wagmiConfig ||
      !deployed?.address ||
      !deployed?.abi ||
      lastFetchedBlock === null
    )
      return

    const publicClient = getPublicClient(wagmiConfig, {
      chainId: network.id
    }) as PublicClient | undefined
    if (!publicClient) return

    const event = (deployed.abi as Abi).find(
      (part) => part.type === "event" && part.name === eventName
    ) as AbiEvent | undefined
    if (!event) return

    try {
      const currentBlock = await getBlockNumber(wagmiConfig, {
        chainId: network.id
      })
      const maxBlock =
        toBlock !== undefined && toBlock < currentBlock ? toBlock : currentBlock
      if (lastFetchedBlock >= maxBlock) return

      isFetchingNewEventStore.set(true)
      const newEvents = await getEvents(
        {
          address: deployed.address,
          event,
          fromBlock: lastFetchedBlock + 1n,
          toBlock: maxBlock,
          args: filters
        },
        publicClient,
        { blockData, transactionData, receiptData }
      )

      if (newEvents && newEvents.length > 0) {
        eventsStore.update((prev) => {
          const combined = [...(newEvents as EventItem[]).reverse(), ...prev]
          const seen = new Set<string>()
          return combined.filter((ev: any) => {
            const key = `${ev?.transactionHash}-${ev?.logIndex}-${ev?.blockHash}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
        })
      }
      lastFetchedBlock = maxBlock
    } catch (error) {
      errorStore.set(error)
    } finally {
      isFetchingNewEventStore.set(false)
    }
  }

  let unwatch: (() => void) | undefined

  if (browser) {
    void refetch()

    if (watch) {
      const { config: wagmiConfig } = get(wagmiContextStore)
      if (wagmiConfig) {
        unwatch = watchBlockNumber(wagmiConfig, {
          onBlockNumber: () => {
            void pollNewEvents()
          },
          poll: true
        })
      }
    }
  }

  const destroy = () => {
    unwatch?.()
    unwatch = undefined
  }

  return {
    data: { subscribe: eventsStore.subscribe },
    status: { subscribe: statusStore.subscribe },
    error: { subscribe: errorStore.subscribe },
    isLoading: { subscribe: isLoadingStore.subscribe },
    isFetchingNewEvent: { subscribe: isFetchingNewEventStore.subscribe },
    refetch,
    destroy
  }
}

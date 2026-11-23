import { browser } from "$app/env"
import { readContract, watchBlockNumber } from "@wagmi/core"
import type { ExtractAbiFunctionNames } from "abitype"
import { get, readable } from "svelte/store"
import { wagmiContextStore } from "../contexts/wagmi.js"
import type {
  AbiFunctionReturnType,
  ContractAbi,
  ContractName
} from "../utils/contract.js"
import type { AllowedChainIds } from "../utils/networks.js"
import { createDeployedContractStore } from "./deployedContract.js"
import { useSelectedNetwork } from "./selectedNetwork.js"

type UseScaffoldReadConfig<
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNames<
    ContractAbi<TContractName>,
    "pure" | "view"
  >
> = {
  contractName: TContractName
  functionName: TFunctionName
  args?: readonly unknown[]
  chainId?: AllowedChainIds
  watch?: boolean
  query?: {
    enabled?: boolean
    refetchInterval?: number
  }
}

type ScaffoldReadResult<TData> = {
  data: TData | undefined
  error: unknown
  isLoading: boolean
  isSuccess: boolean
  refetch: () => Promise<void>
}

/**
 * Wrapper around @wagmi/core readContract which automatically loads (by name) the contract ABI and address from
 * the contracts present in deployedContracts.ts & externalContracts.ts corresponding to targetNetworks configured in scaffold.config.ts
 * @param config - The config settings
 * @param config.contractName - deployed contract name
 * @param config.functionName - name of the function to be called
 * @param config.args - args to be passed to the function call
 * @param config.chainId - optional chainId that is configured with the scaffold project to make use for multi-chain interactions.
 */
export function createScaffoldReadContractStore<
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNames<
    ContractAbi<TContractName>,
    "pure" | "view"
  >
>(config: UseScaffoldReadConfig<TContractName, TFunctionName>) {
  const {
    contractName,
    functionName,
    args,
    chainId,
    watch: watchConfig,
    query: queryOptions
  } = config
  const defaultWatch = watchConfig ?? true

  const selectedNetwork = useSelectedNetwork(chainId)
  const deployedContractStore = createDeployedContractStore({
    contractName,
    chainId
  })

  type TData = AbiFunctionReturnType<ContractAbi, TFunctionName>

  const initial: ScaffoldReadResult<TData> = {
    data: undefined,
    error: null,
    isLoading: true,
    isSuccess: false,
    refetch: async () => {}
  }

  return readable(initial, (set) => {
    if (!browser) return

    let unwatch: (() => void) | undefined
    let cancelled = false
    let refetchIntervalId: ReturnType<typeof setInterval> | undefined

    const run = async () => {
      const { config: wagmiConfig } = get(wagmiContextStore)
      const network = get(selectedNetwork)
      const deployed = get(deployedContractStore)

      if (!wagmiConfig || !deployed?.data?.address || !deployed?.data?.abi) {
        if (!cancelled) {
          set({
            data: undefined,
            error: null,
            isLoading: false,
            isSuccess: false,
            refetch: run
          })
        }
        return
      }

      const enabled =
        queryOptions?.enabled ??
        (!Array.isArray(args) || !args.some((a) => a === undefined))
      if (!enabled) {
        if (!cancelled) {
          set({
            data: undefined,
            error: null,
            isLoading: false,
            isSuccess: false,
            refetch: run
          })
        }
        return
      }

      try {
        const data = (await readContract(wagmiConfig, {
          address: deployed.data.address,
          abi: deployed.data.abi,
          functionName,
          args: args as any,
          chainId: network.id
        })) as TData
        if (!cancelled) {
          set({
            data,
            error: null,
            isLoading: false,
            isSuccess: true,
            refetch: run
          })
        }
      } catch (error) {
        if (!cancelled) {
          set({
            data: undefined,
            error,
            isLoading: false,
            isSuccess: false,
            refetch: run
          })
        }
      }
    }

    void run()

    if (defaultWatch) {
      const { config: wagmiConfig } = get(wagmiContextStore)
      if (wagmiConfig) {
        unwatch = watchBlockNumber(wagmiConfig, {
          onBlockNumber: () => {
            void run()
          },
          poll: true
        })
      }
    }

    if (queryOptions?.refetchInterval && queryOptions.refetchInterval > 0) {
      refetchIntervalId = setInterval(() => {
        void run()
      }, queryOptions.refetchInterval)
    }

    return () => {
      cancelled = true
      unwatch?.()
      if (refetchIntervalId) clearInterval(refetchIntervalId)
    }
  })
}

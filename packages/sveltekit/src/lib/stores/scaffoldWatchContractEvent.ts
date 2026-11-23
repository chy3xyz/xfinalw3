import { browser } from "$app/env"
import { watchContractEvent } from "@wagmi/core"
import type { ExtractAbiEventNames } from "abitype"
import { get, readable } from "svelte/store"
import type { Abi, Log } from "viem"
import { wagmiContextStore } from "../contexts/wagmi.js"
import type {
  ContractAbi,
  ContractName,
  UseScaffoldEventConfig
} from "../utils/contract.js"
import type { AllowedChainIds } from "../utils/networks.js"
import { createDeployedContractStore } from "./deployedContract.js"
import { useSelectedNetwork } from "./selectedNetwork.js"

/**
 * Wrapper around @wagmi/core watchContractEvent which automatically loads (by name) the contract ABI and
 * address from the contracts present in deployedContracts.ts & externalContracts.ts
 * @param config - The config settings
 * @param config.contractName - deployed contract name
 * @param config.eventName - name of the event to listen for
 * @param config.chainId - optional chainId that is configured with the scaffold project to make use for multi-chain interactions.
 * @param config.onLogs - the callback that receives events.
 */
export function createScaffoldWatchContractEventStore<
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>
>(config: UseScaffoldEventConfig<TContractName, TEventName>) {
  const { contractName, eventName, chainId, onLogs } = config

  const selectedNetwork = useSelectedNetwork(chainId)
  const deployedContractStore = createDeployedContractStore({
    contractName,
    chainId: get(selectedNetwork).id as AllowedChainIds
  })

  return readable(undefined, (_set) => {
    if (!browser) return

    let unwatch: (() => void) | undefined

    const start = () => {
      unwatch?.()
      unwatch = undefined

      const { config: wagmiConfig } = get(wagmiContextStore)
      const network = get(selectedNetwork)
      const deployed = get(deployedContractStore)

      if (!wagmiConfig || !deployed?.data?.address || !deployed?.data?.abi)
        return

      unwatch = watchContractEvent(wagmiConfig, {
        address: deployed.data.address,
        abi: deployed.data.abi as Abi,
        chainId: network.id,
        eventName,
        onLogs: (logs: Log[]) => onLogs(logs as Parameters<typeof onLogs>[0])
      })
    }

    start()

    const unsubNetwork = selectedNetwork.subscribe(() => start())
    const unsubDeployed = deployedContractStore.subscribe(() => start())
    const unsubWagmi = wagmiContextStore.subscribe(() => start())

    return () => {
      unwatch?.()
      unsubNetwork()
      unsubDeployed()
      unsubWagmi()
    }
  })
}

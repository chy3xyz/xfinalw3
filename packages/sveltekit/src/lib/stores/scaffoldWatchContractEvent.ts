import { derived, get } from 'svelte/store';
import { useWatchContractEvent } from 'wagmi';
import { useSelectedNetwork } from './selectedNetwork.js';
import { createDeployedContractStore } from './deployedContract.js';
import type { ExtractAbiEventNames } from 'abitype';
import type { Abi, Log } from 'viem';
import type { ContractAbi, ContractName, UseScaffoldEventConfig } from '../utils/contract.js';
import type { AllowedChainIds } from '../utils/networks.js';

/**
 * Wrapper around wagmi's useWatchContractEvent hook which automatically loads (by name) the contract ABI and
 * address from the contracts present in deployedContracts.ts & externalContracts.ts
 * @param config - The config settings
 * @param config.contractName - deployed contract name
 * @param config.eventName - name of the event to listen for
 * @param config.chainId - optional chainId that is configured with the scaffold project to make use for multi-chain interactions.
 * @param config.onLogs - the callback that receives events.
 */
export function createScaffoldWatchContractEventStore<
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
>(config: UseScaffoldEventConfig<TContractName, TEventName>) {
  const { contractName, eventName, chainId, onLogs } = config;

  const selectedNetwork = useSelectedNetwork(chainId);
  const deployedContractStore = createDeployedContractStore({
    contractName,
    chainId: get(selectedNetwork).id as AllowedChainIds,
  });

  const deployedContractData = derived(deployedContractStore, $store => $store.data);

  return derived([selectedNetwork, deployedContractData], ([$selectedNetwork, $deployedContract]) => {
    return useWatchContractEvent({
      address: $deployedContract?.address,
      abi: $deployedContract?.abi as Abi,
      chainId: $selectedNetwork.id,
      onLogs: (logs: Log[]) => onLogs(logs as Parameters<typeof onLogs>[0]),
      eventName,
    });
  });
}


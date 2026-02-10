import { writable, derived, get } from 'svelte/store';
import { getPublicClient } from '@wagmi/core';
import { browser } from '$app/environment';
import { useSelectedNetwork } from './selectedNetwork.js';
import { contracts, type Contract, type ContractName, ContractCodeStatus } from '../utils/contract.js';
import type { AllowedChainIds } from '../utils/networks.js';
import { wagmiConfig } from '../config/wagmi.js';

type UseDeployedContractConfig<TContractName extends ContractName> = {
  contractName: TContractName;
  chainId?: AllowedChainIds;
};

type DeployedContractData<TContractName extends ContractName> = {
  data: Contract<TContractName> | undefined;
  isLoading: boolean;
};

/**
 * Gets the matching contract info for the provided contract name from the contracts present in deployedContracts.ts
 * and externalContracts.ts corresponding to targetNetworks configured in scaffold.config.ts
 */
export function createDeployedContractStore<TContractName extends ContractName>(
  config: UseDeployedContractConfig<TContractName>,
) {
  const { contractName, chainId } = config;
  const selectedNetwork = useSelectedNetwork(chainId);
  
  const status = writable<ContractCodeStatus>(ContractCodeStatus.LOADING);

  const store = derived([status, selectedNetwork], ([$status, $selectedNetwork]) => {
    const deployedContract = contracts?.[$selectedNetwork.id]?.[contractName] as Contract<TContractName> | undefined;
    
    return {
      data: $status === ContractCodeStatus.DEPLOYED ? deployedContract : undefined,
      isLoading: $status === ContractCodeStatus.LOADING,
    } as DeployedContractData<TContractName>;
  });

  // Check contract deployment
  const checkContractDeployment = async () => {
    try {
      if (!browser) return;
      
      const $selectedNetwork = get(selectedNetwork);
      const deployedContract = contracts?.[$selectedNetwork.id]?.[contractName] as Contract<TContractName> | undefined;

      if (!deployedContract) {
        status.set(ContractCodeStatus.NOT_FOUND);
        return;
      }

      // Get public client using @wagmi/core API instead of React hook
      const publicClient = getPublicClient(wagmiConfig, { chainId: $selectedNetwork.id });
      
      if (!publicClient) {
        status.set(ContractCodeStatus.NOT_FOUND);
        return;
      }

      const code = await publicClient.getBytecode({
        address: deployedContract.address,
      });

      if (code === '0x') {
        status.set(ContractCodeStatus.NOT_FOUND);
        return;
      }
      
      status.set(ContractCodeStatus.DEPLOYED);
    } catch (e) {
      console.error(e);
      status.set(ContractCodeStatus.NOT_FOUND);
    }
  };

  // Initialize check and watch for network changes
  if (browser) {
    checkContractDeployment();
    
    // Re-check when network changes
    selectedNetwork.subscribe(() => {
      status.set(ContractCodeStatus.LOADING);
      checkContractDeployment();
    });
  }

  return {
    subscribe: store.subscribe,
    checkContractDeployment,
  };
}


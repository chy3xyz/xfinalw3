import { derived, get } from 'svelte/store';
import { Account, Chain, Client, Transport, getContract } from 'viem';
import type { Address } from 'viem';
import { usePublicClient, useWalletClient } from 'wagmi';
import { GetWalletClientReturnType } from 'wagmi/actions';
import { useSelectedNetwork } from './selectedNetwork.js';
import { createDeployedContractStore } from './deployedContract.js';
import type { Contract, ContractName } from '../utils/contract.js';
import type { AllowedChainIds } from '../utils/networks.js';

/**
 * Gets a viem instance of the contract present in deployedContracts.ts or externalContracts.ts corresponding to
 * targetNetworks configured in scaffold.config.ts. Optional walletClient can be passed for doing write transactions.
 * @param config - The config settings for the hook
 * @param config.contractName - deployed contract name
 * @param config.walletClient - optional walletClient from wagmi useWalletClient hook can be passed for doing write transactions
 * @param config.chainId - optional chainId that is configured with the scaffold project to make use for multi-chain interactions.
 */
export function createScaffoldContractStore<
  TContractName extends ContractName,
  TWalletClient extends Exclude<GetWalletClientReturnType, null> | undefined,
>(config: {
  contractName: TContractName;
  walletClient?: TWalletClient | null;
  chainId?: AllowedChainIds;
}) {
  const { contractName, walletClient, chainId } = config;

  const selectedNetwork = useSelectedNetwork(chainId);
  const deployedContractStore = createDeployedContractStore({
    contractName,
    chainId: get(selectedNetwork).id as AllowedChainIds,
  });

  const deployedContractData = derived(deployedContractStore, $store => $store.data);
  const isLoading = derived(deployedContractStore, $store => $store.isLoading);
  const publicClient = usePublicClient({ chainId: get(selectedNetwork).id });
  const walletClientData = useWalletClient();

  const contract = derived(
    [deployedContractData, publicClient, walletClientData],
    ([$deployedContract, $publicClient, $walletClientData]) => {
      const finalWalletClient = walletClient || $walletClientData?.data;

      if (!$deployedContract || !$publicClient) {
        return undefined;
      }

      return getContract<
        Transport,
        Address,
        Contract<TContractName>['abi'],
        TWalletClient extends Exclude<GetWalletClientReturnType, null>
          ? {
              public: Client<Transport, Chain>;
              wallet: TWalletClient;
            }
          : { public: Client<Transport, Chain> },
        Chain,
        Account
      >({
        address: $deployedContract.address,
        abi: $deployedContract.abi as Contract<TContractName>['abi'],
        client: {
          public: $publicClient,
          wallet: finalWalletClient ? finalWalletClient : undefined,
        } as any,
      });
    },
  );

  return {
    data: contract,
    isLoading,
  };
}


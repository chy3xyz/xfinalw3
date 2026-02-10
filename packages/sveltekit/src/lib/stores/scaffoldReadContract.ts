import { derived, get } from 'svelte/store';
import { useReadContract, useBlockNumber } from 'wagmi';
import { useQueryClient } from '@tanstack/svelte-query';
import { useSelectedNetwork } from './selectedNetwork.js';
import { createDeployedContractStore } from './deployedContract.js';
import type { ExtractAbiFunctionNames } from 'abitype';
import type { ContractAbi, ContractName, AbiFunctionReturnType } from '../utils/contract.js';
import type { AllowedChainIds } from '../utils/networks.js';
import type { QueryObserverResult, RefetchOptions } from '@tanstack/svelte-query';
import type { BaseError } from 'viem';

type UseScaffoldReadConfig<
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNames<ContractAbi<TContractName>, 'pure' | 'view'>,
> = {
  contractName: TContractName;
  functionName: TFunctionName;
  args?: readonly unknown[];
  chainId?: AllowedChainIds;
  watch?: boolean;
  query?: {
    enabled?: boolean;
    refetchInterval?: number;
  };
};

/**
 * Wrapper around wagmi's useReadContract hook which automatically loads (by name) the contract ABI and address from
 * the contracts present in deployedContracts.ts & externalContracts.ts corresponding to targetNetworks configured in scaffold.config.ts
 * @param config - The config settings, including extra wagmi configuration
 * @param config.contractName - deployed contract name
 * @param config.functionName - name of the function to be called
 * @param config.args - args to be passed to the function call
 * @param config.chainId - optional chainId that is configured with the scaffold project to make use for multi-chain interactions.
 */
export function createScaffoldReadContractStore<
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNames<ContractAbi<TContractName>, 'pure' | 'view'>,
>(config: UseScaffoldReadConfig<TContractName, TFunctionName>) {
  const { contractName, functionName, args, chainId, watch: watchConfig, query: queryOptions } = config;
  const defaultWatch = watchConfig ?? true;
  
  const selectedNetwork = useSelectedNetwork(chainId);
  const deployedContractStore = createDeployedContractStore({ contractName, chainId });
  const queryClient = useQueryClient();

  // Get block number for watching
  const blockNumberResult = useBlockNumber({
    watch: defaultWatch,
    query: {
      enabled: defaultWatch,
    },
  });

  const readContractResult = derived(
    [selectedNetwork, deployedContractStore, blockNumberResult],
    ([$selectedNetwork, $deployedContract, $blockNumber]) => {
      const readContractHookRes = useReadContract({
        chainId: $selectedNetwork.id,
        functionName,
        address: $deployedContract.data?.address,
        abi: $deployedContract.data?.abi,
        args,
        query: {
          enabled: !Array.isArray(args) || !args.some((arg) => arg === undefined),
          ...queryOptions,
        },
      }) as Omit<ReturnType<typeof useReadContract>, "data" | "refetch"> & {
        data: AbiFunctionReturnType<ContractAbi, TFunctionName> | undefined;
        refetch: (
          options?: RefetchOptions | undefined,
        ) => Promise<QueryObserverResult<AbiFunctionReturnType<ContractAbi, TFunctionName>, BaseError>>;
      };

      // Invalidate queries on new block when watching
      if (defaultWatch && $blockNumber?.data) {
        // Use a reactive statement to invalidate queries
        queryClient.invalidateQueries({ queryKey: readContractHookRes.queryKey });
      }

      return readContractHookRes;
    },
  );

  return readContractResult;
}


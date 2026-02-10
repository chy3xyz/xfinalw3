import { writable, get } from 'svelte/store';
import { getAccount } from '@wagmi/core';
import { writeContract } from 'wagmi/actions';
import { useSelectedNetwork } from './selectedNetwork.js';
import { createDeployedContractStore } from './deployedContract.js';
import { createTransactor } from './transactor.js';
import type { ExtractAbiFunctionNames } from 'abitype';
import type { ContractAbi, ContractName, ScaffoldWriteContractVariables, ScaffoldWriteContractOptions } from '../utils/contract.js';
import type { AllowedChainIds } from '../utils/networks.js';
import { notification } from '../utils/notification.js';
import { simulateContractWriteAndNotifyError } from '../utils/contract.js';
import type { Abi, WriteContractVariables, WriteContractReturnType, WriteContractErrorType } from 'viem';
import type { Config } from 'wagmi';
import type { MutateOptions } from '@tanstack/svelte-query';
import { browser } from '$app/environment';
import { wagmiContextStore } from '../contexts/wagmi.js';

type UseScaffoldWriteConfig<TContractName extends ContractName> = {
  contractName: TContractName;
  chainId?: AllowedChainIds;
  disableSimulate?: boolean;
  writeContractParams?: any;
};

/**
 * Wrapper around wagmi's writeContract function which automatically loads (by name) the contract ABI and address from
 * the contracts present in deployedContracts.ts & externalContracts.ts corresponding to targetNetworks configured in scaffold.config.ts
 * @param config - The config settings
 * @param config.contractName - name of the contract to be written to
 * @param config.chainId - optional chainId that is configured with the scaffold project to make use for multi-chain interactions.
 * @param config.disableSimulate - optional flag to disable simulation before writing
 */
export function createScaffoldWriteContractStore<TContractName extends ContractName>(
  config: UseScaffoldWriteConfig<TContractName>,
) {
  const { contractName, chainId, disableSimulate: configDisableSimulate } = config;
  const isMining = writable(false);
  const writeTx = createTransactor();
  const selectedNetwork = useSelectedNetwork(chainId);
  const deployedContractStore = createDeployedContractStore({ contractName, chainId });

  const writeContractAsync = async <
    TFunctionName extends ExtractAbiFunctionNames<ContractAbi<TContractName>, 'nonpayable' | 'payable'>,
  >(
    variables: ScaffoldWriteContractVariables<TContractName, TFunctionName>,
    options?: ScaffoldWriteContractOptions,
  ) => {
    if (!browser) {
      throw new Error('writeContractAsync can only be called in browser');
    }

    const $selectedNetwork = get(selectedNetwork);
    const $deployedContract = get(deployedContractStore);

    if (!$deployedContract.data) {
      notification.error('Target Contract is not deployed, did you forget to run `bun run deploy`?');
      return;
    }

    // 使用 store 获取 config，避免在异步回调中调用 getContext
    const { config: wagmiConfig } = get(wagmiContextStore);
    if (!wagmiConfig) {
      notification.error('配置未初始化，请刷新页面');
      return;
    }

    // Get account info using @wagmi/core API
    const account = getAccount(wagmiConfig);
    if (!account.address) {
      notification.error('Please connect your wallet');
      return;
    }

    if (account.chainId !== $selectedNetwork.id) {
      notification.error(`Wallet is connected to the wrong network. Please switch to ${$selectedNetwork.name}`);
      return;
    }

    try {
      isMining.set(true);
      const { blockConfirmations, onBlockConfirmation, disableSimulate } = options || {};

      const writeContractObject = {
        abi: $deployedContract.data.abi as Abi,
        address: $deployedContract.data.address,
        ...variables,
      } as WriteContractVariables<Abi, string, any[], Config, number>;

      if (!configDisableSimulate && !disableSimulate) {
        await simulateContractWriteAndNotifyError({
          wagmiConfig,
          writeContractParams: writeContractObject,
          chainId: $selectedNetwork.id as AllowedChainIds,
        });
      }

      const makeWriteWithParams = async () => {
        const result = await writeContract(wagmiConfig, writeContractObject);
        return result;
      };
      
      const writeTxResult = await writeTx(makeWriteWithParams, { blockConfirmations, onBlockConfirmation });

      return writeTxResult;
    } catch (e: any) {
      throw e;
    } finally {
      isMining.set(false);
    }
  };

  const writeContractFn = <
    TFunctionName extends ExtractAbiFunctionNames<ContractAbi<TContractName>, 'nonpayable' | 'payable'>,
  >(
    variables: ScaffoldWriteContractVariables<TContractName, TFunctionName>,
    options?: Omit<ScaffoldWriteContractOptions, 'onBlockConfirmation' | 'blockConfirmations'>,
  ) => {
    if (!browser) {
      notification.error('writeContract can only be called in browser');
      return;
    }

    const $selectedNetwork = get(selectedNetwork);
    const $deployedContract = get(deployedContractStore);

    if (!$deployedContract.data) {
      notification.error('Target Contract is not deployed, did you forget to run `bun run deploy`?');
      return;
    }

    // 使用 store 获取 config，避免在异步回调中调用 getContext
    const { config: wagmiConfig } = get(wagmiContextStore);
    if (!wagmiConfig) {
      notification.error('配置未初始化，请刷新页面');
      return;
    }

    const account = getAccount(wagmiConfig);
    if (!account.address) {
      notification.error('Please connect your wallet');
      return;
    }

    if (account.chainId !== $selectedNetwork.id) {
      notification.error(`Wallet is connected to the wrong network. Please switch to ${$selectedNetwork.name}`);
      return;
    }

    // Use writeContractAsync for synchronous-like API
    writeContractAsync(variables, options).catch((error) => {
      console.error('Write contract error:', error);
    });
  };

  return {
    isMining: { subscribe: isMining.subscribe },
    writeContractAsync,
    writeContract: writeContractFn,
  };
}


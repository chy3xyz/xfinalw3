import {
  readContract,
  writeContract,
  getChainId,
  getAccount,
} from "@wagmi/core";
import { formatEther, parseEther } from "viem";
import type { Address } from "viem";
import type { Config } from "wagmi";
import { contracts } from "./contract.js";
import { wagmiContextStore } from "../contexts/wagmi.js";
import { get } from "svelte/store";
import { browser } from "$app/environment";

export interface ContractCallOptions {
  contractName: string;
  functionName: string;
  args?: readonly unknown[];
  chainId?: number;
}

export interface ContractWriteOptions extends ContractCallOptions {
  value?: bigint;
}

class ContractClient {
  private config: Config | null = null;

  constructor() {
    if (browser) {
      const { config } = get(wagmiContextStore);
      this.config = config;
    }
  }

  private getConfig(): Config {
    if (!this.config) {
      const { config } = get(wagmiContextStore);
      if (!config) throw new Error("Wagmi config not initialized");
      this.config = config;
    }
    return this.config;
  }

  private getContract(contractName: string, chainId?: number) {
    const config = this.getConfig();
    const targetChainId = chainId || getChainId(config);
    const contract = (contracts as any)?.[targetChainId]?.[contractName];

    if (!contract?.address || !contract?.abi) {
      throw new Error(
        `Contract ${contractName} not found on chain ${targetChainId}`,
      );
    }

    return {
      address: contract.address as Address,
      abi: contract.abi,
      chainId: targetChainId,
    };
  }

  async read<T = unknown>(options: ContractCallOptions): Promise<T> {
    const { address, abi, chainId } = this.getContract(
      options.contractName,
      options.chainId,
    );
    const config = this.getConfig();

    const params: any = {
      address,
      abi,
      functionName: options.functionName,
      chainId,
    };

    if (options.args && options.args.length > 0) {
      params.args = options.args;
    }

    return readContract(config, params) as Promise<T>;
  }

  async write(options: ContractWriteOptions): Promise<`0x${string}`> {
    const { address, abi, chainId } = this.getContract(
      options.contractName,
      options.chainId,
    );
    const config = this.getConfig();

    const account = getAccount(config);
    if (!account.address) {
      throw new Error("Wallet not connected");
    }

    const params: any = {
      address,
      abi,
      functionName: options.functionName,
      chainId,
    };

    if (options.args && options.args.length > 0) {
      params.args = options.args;
    }

    if (options.value) {
      params.value = options.value;
    }

    return writeContract(config, params);
  }

  async readEther(options: ContractCallOptions): Promise<string> {
    const result = await this.read<bigint>(options);
    return formatEther(result || 0n);
  }

  formatEther(value: bigint): string {
    return formatEther(value);
  }

  parseEther(value: string): bigint {
    return parseEther(value);
  }
}

export const contractClient = new ContractClient();

export async function contractRead<T = unknown>(
  options: ContractCallOptions,
): Promise<T> {
  return contractClient.read<T>(options);
}

export async function contractWrite(
  options: ContractWriteOptions,
): Promise<`0x${string}`> {
  return contractClient.write(options);
}

export async function contractReadEther(
  options: ContractCallOptions,
): Promise<string> {
  return contractClient.readEther(options);
}

export { ContractClient };

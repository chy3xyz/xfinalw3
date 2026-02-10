import { createWalletClient, http, createPublicClient, type Address, type Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";
import { logger } from "../utils/logger.js";
import type { ContractConfig } from "../types/config.js";

// 示例合约 ABI（根据你的实际合约修改）
const EXAMPLE_CONTRACT_ABI = [
  {
    inputs: [],
    name: "getValue",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_value", type: "uint256" }],
    name: "setValue",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export class ContractJob {
  private walletClient;
  private publicClient;
  private account;
  private contractAddress: Address;
  private chain: Chain;

  constructor(config: ContractConfig) {
    // 从私钥创建账户
    this.account = privateKeyToAccount(config.privateKey);

    // 根据 chainId 选择链（默认使用 foundry）
    this.chain = config.chainId === 31337 ? foundry : foundry; // 可以根据需要扩展

    // 创建公共客户端（用于读取）
    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(config.rpcUrl),
    });

    // 创建钱包客户端（用于写入）
    this.walletClient = createWalletClient({
      account: this.account,
      chain: this.chain,
      transport: http(config.rpcUrl),
    });

    // 合约地址（从环境变量或配置中获取）
    this.contractAddress = (process.env.CONTRACT_ADDRESS as Address) || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

    logger.info(`Initialized ContractJob for contract: ${this.contractAddress}`);
  }

  /**
   * 执行合约读写操作
   */
  async execute() {
    try {
      // 1. 读取合约数据
      const value = await this.readContractData();
      logger.info(`Current contract value: ${value}`);

      // 2. 写入合约数据（示例：如果值小于某个阈值，则更新）
      if (value < 100n) {
        await this.writeContractData(100n);
        logger.info("Updated contract value to 100");
      }
    } catch (error) {
      logger.error("Error in execute:", error);
      throw error;
    }
  }

  /**
   * 读取合约数据
   */
  async readContractData(): Promise<bigint> {
    try {
      const value = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: EXAMPLE_CONTRACT_ABI,
        functionName: "getValue",
      });

      return value as bigint;
    } catch (error) {
      logger.error("Error reading contract:", error);
      throw error;
    }
  }

  /**
   * 写入合约数据
   */
  async writeContractData(newValue: bigint): Promise<string> {
    try {
      // 1. 模拟交易以估算 gas
      const { request } = await this.publicClient.simulateContract({
        account: this.account,
        address: this.contractAddress,
        abi: EXAMPLE_CONTRACT_ABI,
        functionName: "setValue",
        args: [newValue],
      });

      // 2. 发送交易
      const hash = await this.walletClient.writeContract(request);

      logger.info(`Transaction sent: ${hash}`);

      // 3. 等待交易确认
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
      });

      logger.info(`Transaction confirmed in block: ${receipt.blockNumber}`);

      return hash;
    } catch (error) {
      logger.error("Error writing contract:", error);
      throw error;
    }
  }

  /**
   * 定期读取任务
   */
  async periodicRead() {
    try {
      const value = await this.readContractData();
      logger.info(`Periodic read - Current value: ${value}`);

      // 可以在这里添加更多的读取逻辑
      // 例如：检查余额、检查状态等
    } catch (error) {
      logger.error("Error in periodic read:", error);
      throw error;
    }
  }

  /**
   * 每日任务
   */
  async dailyTask() {
    try {
      logger.info("Executing daily task...");

      // 示例：每日重置或更新某些值
      // await this.writeContractData(0n);

      logger.info("Daily task completed");
    } catch (error) {
      logger.error("Error in daily task:", error);
      throw error;
    }
  }

  /**
   * 获取账户余额
   */
  async getBalance(): Promise<bigint> {
    try {
      const balance = await this.publicClient.getBalance({
        address: this.account.address,
      });
      return balance;
    } catch (error) {
      logger.error("Error getting balance:", error);
      throw error;
    }
  }
}


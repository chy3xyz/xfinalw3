import {
  http,
  type Address,
  type Chain,
  createPublicClient,
  createWalletClient
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { foundry } from "viem/chains"
import { writesEnabled } from "../health.js"
import type { ContractConfig } from "../types/config.js"
import { logger } from "../utils/logger.js"

const COUNTER_ABI = [
  {
    type: "function",
    name: "getCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }]
  },
  {
    type: "function",
    name: "setCount",
    stateMutability: "nonpayable",
    inputs: [{ name: "newCount", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    name: "increment",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  }
] as const

const CHAIN_BY_ID: Record<number, Chain> = {
  31337: foundry
}

export class ContractJob {
  private walletClient
  private publicClient
  private account
  private contractAddress: Address
  private chain: Chain

  constructor(config: ContractConfig) {
    if (!process.env.CONTRACT_ADDRESS) {
      logger.error("CONTRACT_ADDRESS environment variable is required")
      process.exit(1)
    }

    this.account = privateKeyToAccount(config.privateKey)

    const chain = CHAIN_BY_ID[config.chainId]
    if (!chain) {
      logger.error(`Unsupported chainId: ${config.chainId}`)
      process.exit(1)
    }
    this.chain = chain

    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(config.rpcUrl)
    })

    this.walletClient = createWalletClient({
      account: this.account,
      chain: this.chain,
      transport: http(config.rpcUrl)
    })

    this.contractAddress = process.env.CONTRACT_ADDRESS as Address

    logger.info(`Initialized ContractJob for contract: ${this.contractAddress}`)
  }

  /**
   * 执行合约读写操作
   */
  async execute() {
    try {
      const value = await this.readContractData()
      logger.info(`Current contract value: ${value}`)

      if (value < 100n) {
        if (!writesEnabled()) {
          logger.info("Write skipped (CRON_WRITE_ENABLED is not true)")
        } else {
          await this.writeContractData(100n)
          logger.info("Updated contract value to 100")
        }
      }
    } catch (error) {
      logger.error("Error in execute:", error)
      throw error
    }
  }

  /**
   * 读取合约数据
   */
  async readContractData(): Promise<bigint> {
    try {
      const value = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: COUNTER_ABI,
        functionName: "getCount"
      })

      return value as bigint
    } catch (error) {
      logger.error("Error reading contract:", error)
      throw error
    }
  }

  /**
   * 写入合约数据
   */
  async writeContractData(newValue: bigint): Promise<string> {
    if (!writesEnabled()) {
      logger.warn(
        "Write blocked: set CRON_WRITE_ENABLED=true to allow chain writes"
      )
      return ""
    }

    try {
      const { request } = await this.publicClient.simulateContract({
        account: this.account,
        address: this.contractAddress,
        abi: COUNTER_ABI,
        functionName: "setCount",
        args: [newValue]
      })

      const hash = await this.walletClient.writeContract(request)

      logger.info(`Transaction sent: ${hash}`)

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash
      })

      logger.info(`Transaction confirmed in block: ${receipt.blockNumber}`)

      return hash
    } catch (error) {
      logger.error("Error writing contract:", error)
      throw error
    }
  }

  /**
   * 定期读取任务
   */
  async periodicRead() {
    try {
      const value = await this.readContractData()
      logger.info(`Periodic read - Current value: ${value}`)
    } catch (error) {
      logger.error("Error in periodic read:", error)
      throw error
    }
  }

  /**
   * 每日任务
   */
  async dailyTask() {
    try {
      logger.info("Executing daily task...")
      logger.info("Daily task completed")
    } catch (error) {
      logger.error("Error in daily task:", error)
      throw error
    }
  }

  /**
   * 获取账户余额
   */
  async getBalance(): Promise<bigint> {
    try {
      const balance = await this.publicClient.getBalance({
        address: this.account.address
      })
      return balance
    } catch (error) {
      logger.error("Error getting balance:", error)
      throw error
    }
  }
}

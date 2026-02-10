import { get } from "svelte/store";
import { getAccount, getChainId, readContract } from "@wagmi/core";
import { writeContract } from "wagmi/actions";
import { formatEther, parseEther } from "viem";
import type { Address } from "viem";
import type { Config } from "wagmi";
import { notification } from "./notification.js";
import type { ContractName } from "./contract.js";
import { contracts } from "./contract.js";
import { wagmiContextStore } from "../contexts/wagmi.js";
import { browser } from "$app/environment";

// 合约名称类型
type MiningContractName = ContractName;

function getConfigAndContract(
  contractName: MiningContractName,
): { config: Config; contract: any; chainId: number } | null {
  if (!browser) return null;
  const { config } = get(wagmiContextStore);
  if (!config) return null;
  const chainId = getChainId(config);
  const contract = (contracts as any)?.[chainId]?.[contractName];
  if (!contract?.address || !contract?.abi) return null;
  return { config, contract, chainId };
}

/**
 * 获取挖矿池信息
 */
export async function getPoolInfo(contractName: MiningContractName) {
  try {
    const ctx = getConfigAndContract(contractName);
    if (!ctx) return null;
    const { config, contract, chainId } = ctx;

    const result = await readContract(config, {
      address: contract.address as Address,
      abi: contract.abi,
      functionName: "getPoolInfo",
      args: [],
      chainId,
    });

    if (!result) return null;

    const data = result as [bigint, bigint, bigint, bigint, bigint];
    return {
      totalLPStaked: formatEther(data[0]),
      currentPeriod: Number(data[1]),
      currentDailyReward: formatEther(data[2]),
      periodStartTime: Number(data[3]),
      nextPeriodTime: Number(data[4]),
    };
  } catch (error) {
    console.error("Error getting pool info:", error);
    return null;
  }
}

/**
 * 获取用户挖矿信息
 */
export async function getUserInfo(
  contractName: MiningContractName,
  userAddress: Address,
) {
  try {
    const ctx = getConfigAndContract(contractName);
    if (!ctx) return null;
    const { config, contract, chainId } = ctx;

    const result = await readContract(config, {
      address: contract.address as Address,
      abi: contract.abi,
      functionName: "getUserInfo",
      args: [userAddress],
      chainId,
    });

    if (!result) return null;

    const data = result as [bigint, bigint, bigint];
    return {
      lpAmount: formatEther(data[0]),
      pendingReward: formatEther(data[1]),
      totalPendingReward: formatEther(data[2]),
    };
  } catch (error) {
    console.error("Error getting user info:", error);
    return null;
  }
}

/**
 * 获取用户待领取奖励
 */
export async function getPendingReward(
  contractName: MiningContractName,
  userAddress: Address,
) {
  try {
    const ctx = getConfigAndContract(contractName);
    if (!ctx) return "0";
    const { config, contract, chainId } = ctx;

    const result = await readContract(config, {
      address: contract.address as Address,
      abi: contract.abi,
      functionName: "getPendingReward",
      args: [userAddress],
      chainId,
    });

    if (!result) return "0";

    return formatEther(result as bigint);
  } catch (error) {
    console.error("Error getting pending reward:", error);
    return "0";
  }
}

/**
 * 质押 LP（自动创建）
 */
export async function stake(
  contractName: MiningContractName,
  lukeAmount: string,
  usdtAmount: string,
) {
  if (!browser) return false;
  try {
    const ctx = getConfigAndContract(contractName);
    if (!ctx) {
      notification.error("配置或合约未初始化");
      return false;
    }
    const { config, contract, chainId } = ctx;
    const account = getAccount(config);
    if (!account.address) {
      notification.error("请先连接钱包");
      return false;
    }
    await writeContract(config, {
      address: contract.address as Address,
      abi: contract.abi,
      functionName: "stake",
      args: [parseEther(lukeAmount), parseEther(usdtAmount)],
      chainId,
    });
    notification.success("质押成功！");
    return true;
  } catch (error: any) {
    console.error("Error staking:", error);
    notification.error("质押失败: " + (error?.message || "未知错误"));
    return false;
  }
}

/**
 * 提取质押的 LP
 */
export async function unstake(
  contractName: MiningContractName,
  lpAmount: string,
) {
  if (!browser) return false;
  try {
    const ctx = getConfigAndContract(contractName);
    if (!ctx) {
      notification.error("配置或合约未初始化");
      return false;
    }
    const { config, contract, chainId } = ctx;
    const account = getAccount(config);
    if (!account.address) {
      notification.error("请先连接钱包");
      return false;
    }
    await writeContract(config, {
      address: contract.address as Address,
      abi: contract.abi,
      functionName: "unstake",
      args: [parseEther(lpAmount)],
      chainId,
    });
    notification.success("提取成功！");
    return true;
  } catch (error: any) {
    console.error("Error unstaking:", error);
    notification.error("提取失败: " + (error?.message || "未知错误"));
    return false;
  }
}

/**
 * 领取挖矿奖励
 */
export async function claimReward(contractName: MiningContractName) {
  if (!browser) return false;
  try {
    const ctx = getConfigAndContract(contractName);
    if (!ctx) {
      notification.error("配置或合约未初始化");
      return false;
    }
    const { config, contract, chainId } = ctx;
    const account = getAccount(config);
    if (!account.address) {
      notification.error("请先连接钱包");
      return false;
    }
    await writeContract(config, {
      address: contract.address as Address,
      abi: contract.abi,
      functionName: "claimReward",
      args: [],
      chainId,
    });
    notification.success("领取成功！");
    return true;
  } catch (error: any) {
    console.error("Error claiming reward:", error);
    notification.error("领取失败: " + (error?.message || "未知错误"));
    return false;
  }
}

/**
 * 更新奖励池（通常由定时任务调用，但也可以手动调用）
 */
export async function updateReward(contractName: MiningContractName) {
  if (!browser) return false;
  try {
    const ctx = getConfigAndContract(contractName);
    if (!ctx) return false;
    const { config, contract, chainId } = ctx;
    await writeContract(config, {
      address: contract.address as Address,
      abi: contract.abi,
      functionName: "updateReward",
      args: [],
      chainId,
    });
    return true;
  } catch (error) {
    console.error("Error updating reward:", error);
    return false;
  }
}

/**
 * 计算预计 LP 数量（估算）
 * @param lukeAmount LUKE 数量
 * @param usdtAmount USDT 数量
 * @returns 预计 LP 数量（字符串）
 */
export function estimateLPAmount(
  lukeAmount: string,
  usdtAmount: string,
): string {
  try {
    const luke = parseFloat(lukeAmount);
    const usdt = parseFloat(usdtAmount);

    if (luke <= 0 || usdt <= 0) return "0";

    // 简化计算：LP 数量约为两种代币数量的几何平均
    // 实际 LP 数量由 DEX 的 addLiquidity 函数计算
    const estimatedLP = Math.sqrt(luke * usdt);
    return estimatedLP.toFixed(6);
  } catch {
    return "0";
  }
}

/**
 * 格式化周期信息
 */
export function formatPeriodInfo(period: number, dailyReward: string): string {
  const increaseRate = period * 10; // 每周期增产 10%
  return `${period}(${increaseRate}%↑)`;
}

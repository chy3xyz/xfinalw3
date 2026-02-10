/**
 * GftStaking 合约前端工具：GFT/USDT LP 质押，奖励来自 5% 滑点交易收益（USDT）
 */
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

const GFT_STAKING_CONTRACT_NAME = "GftStaking" as ContractName;

function getConfigAndContract(): {
  config: Config;
  contract: any;
  chainId: number;
} | null {
  if (!browser) return null;
  const { config } = get(wagmiContextStore);
  if (!config) return null;
  const chainId = getChainId(config);
  const contract = (contracts as any)?.[chainId]?.[GFT_STAKING_CONTRACT_NAME];
  if (!contract?.address || !contract?.abi) return null;
  return { config, contract, chainId };
}

/**
 * 获取 GFT 质押池信息（总 LP、奖金池）
 */
export async function getGftStakingPoolInfo(): Promise<{
  totalLPStaked: string;
  totalRewardPool: string;
} | null> {
  try {
    const ctx = getConfigAndContract();
    if (!ctx) return null;
    const { config, contract, chainId } = ctx;

    const [totalLPStaked, totalRewardPool] = await Promise.all([
      readContract(config, {
        address: contract.address as Address,
        abi: contract.abi,
        functionName: "totalLPStaked",
        args: [],
        chainId,
      }),
      readContract(config, {
        address: contract.address as Address,
        abi: contract.abi,
        functionName: "totalRewardPool",
        args: [],
        chainId,
      }),
    ]);

    return {
      totalLPStaked: formatEther((totalLPStaked as bigint) ?? 0n),
      totalRewardPool: formatEther((totalRewardPool as bigint) ?? 0n),
    };
  } catch (error) {
    console.error("Error getting GFT staking pool info:", error);
    return null;
  }
}

/**
 * 获取用户 GFT 质押信息
 */
export async function getGftStakingUserInfo(
  userAddress: Address
): Promise<{
  lpAmount: string;
  pendingReward: string;
  totalPendingReward: string;
} | null> {
  try {
    const ctx = getConfigAndContract();
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
    console.error("Error getting GFT staking user info:", error);
    return null;
  }
}

/**
 * 质押 GFT + USDT（自动创建 LP 并质押）
 */
export async function gftStake(
  gftAmount: string,
  usdtAmount: string
): Promise<boolean> {
  if (!browser) return false;
  try {
    const ctx = getConfigAndContract();
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
      args: [parseEther(gftAmount), parseEther(usdtAmount)],
      chainId,
    });
    notification.success("质押成功！");
    return true;
  } catch (error: any) {
    console.error("Error staking GFT/USDT:", error);
    notification.error("质押失败: " + (error?.message || "未知错误"));
    return false;
  }
}

/**
 * 提取质押的 GFT/USDT LP
 */
export async function gftUnstake(lpAmount: string): Promise<boolean> {
  if (!browser) return false;
  try {
    const ctx = getConfigAndContract();
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
    console.error("Error unstaking GFT:", error);
    notification.error("提取失败: " + (error?.message || "未知错误"));
    return false;
  }
}

/**
 * 领取 GFT 质押奖励（USDT，来自 5% 滑点）
 */
export async function gftClaimReward(): Promise<boolean> {
  if (!browser) return false;
  try {
    const ctx = getConfigAndContract();
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
    console.error("Error claiming GFT staking reward:", error);
    notification.error("领取失败: " + (error?.message || "未知错误"));
    return false;
  }
}

/**
 * 估算 GFT/USDT 添加流动性后获得的 LP 数量
 */
export function estimateGftLpAmount(
  gftAmount: string,
  usdtAmount: string
): string {
  try {
    const gft = parseFloat(gftAmount);
    const usdt = parseFloat(usdtAmount);
    if (gft <= 0 || usdt <= 0) return "0";
    const estimatedLP = Math.sqrt(gft * usdt);
    return estimatedLP.toFixed(6);
  } catch {
    return "0";
  }
}

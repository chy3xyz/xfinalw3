import type { Hash, SendTransactionParameters, TransactionReceipt, WalletClient } from "viem";
import { getWalletClient, getPublicClient, getAccount } from "@wagmi/core";
import type { Config } from "wagmi";
import type { SendTransactionMutate } from "wagmi/query";
import scaffoldConfig from "scaffold.config";
import { wagmiConfig } from "../config/wagmi.js";
import type { AllowedChainIds } from "../utils/networkTypes.js";
import { getBlockExplorerTxLink } from "../utils/networks.js";
import { notification } from "../utils/notification.js";
import { getParsedErrorWithAllAbis } from "../utils/contract.js";
import type { TransactorFuncOptions } from "../utils/contract.js";

type TransactionFunc = (
  tx: (() => Promise<Hash>) | Parameters<SendTransactionMutate<Config, undefined>>[0],
  options?: TransactorFuncOptions,
) => Promise<Hash | undefined>;

/**
 * Custom notification content for TXs.
 */
const createTxnNotification = (message: string, blockExplorerLink?: string) => {
  return {
    message,
    blockExplorerLink,
  };
};

/**
 * Creates a transactor function that shows UI feedback for transactions.
 * @param _walletClient - Optional wallet client to use. If not provided, will get the one from wagmi config.
 * @returns function that takes in transaction function as callback, shows UI feedback for transaction and returns a promise of the transaction hash
 */
export const createTransactor = (_walletClient?: WalletClient): TransactionFunc => {
  const result: TransactionFunc = async (tx, options) => {
    // Get wallet client when actually needed (not at creation time)
    let walletClient = _walletClient;
    
    if (walletClient === undefined) {
      try {
        walletClient = getWalletClient(wagmiConfig);
      } catch (e) {
        // Wallet client not available
        notification.error("Cannot access account");
        console.error("⚡️ ~ file: transactor.ts ~ error", e);
        return;
      }
    }

    if (!walletClient) {
      notification.error("Cannot access account");
      console.error("⚡️ ~ file: transactor.ts ~ error");
      return;
    }

    let notificationId: string | null = null;
    let transactionHash: Hash | undefined = undefined;
    let transactionReceipt: TransactionReceipt | undefined;
    let blockExplorerTxURL = "";
    let chainId: number = scaffoldConfig.targetNetworks[0].id;
    try {
      // Get chainId from account instead of walletClient
      const account = getAccount(wagmiConfig);
      if (account.chainId) {
        chainId = account.chainId;
      } else {
        // Fallback to walletClient.getChainId() if account doesn't have chainId
        chainId = await walletClient.getChainId();
      }
      // Get full transaction from public client
      const publicClient = getPublicClient(wagmiConfig);

      notificationId = notification.loading(createTxnNotification("Awaiting for user confirmation"));
      if (typeof tx === "function") {
        // Tx is already prepared by the caller
        const result = await tx();
        transactionHash = result;
      } else if (tx != null) {
        transactionHash = await walletClient.sendTransaction(tx as SendTransactionParameters);
      } else {
        throw new Error("Incorrect transaction passed to transactor");
      }
      if (notificationId) {
        notification.remove(notificationId);
      }

      blockExplorerTxURL = chainId ? getBlockExplorerTxLink(chainId, transactionHash) : "";

      notificationId = notification.loading(
        createTxnNotification("Waiting for transaction to complete.", blockExplorerTxURL),
      );

      transactionReceipt = await publicClient.waitForTransactionReceipt({
        hash: transactionHash,
        confirmations: options?.blockConfirmations,
      });
      if (notificationId) {
        notification.remove(notificationId);
      }

      if (transactionReceipt.status === "reverted") throw new Error("Transaction reverted");

      notification.success(
        createTxnNotification("Transaction completed successfully!", blockExplorerTxURL),
        {
          icon: "🎉",
        },
      );

      if (options?.onBlockConfirmation) options.onBlockConfirmation(transactionReceipt);
    } catch (error: any) {
      if (notificationId) {
        notification.remove(notificationId);
      }
      console.error("⚡️ ~ file: transactor.ts ~ error", error);
      const message = getParsedErrorWithAllAbis(error, chainId as AllowedChainIds);

      // if receipt was reverted, show notification with block explorer link and return error
      if (transactionReceipt?.status === "reverted") {
        notification.error(createTxnNotification(message, blockExplorerTxURL));
        throw error;
      }

      notification.error(message);
      throw error;
    }

    return transactionHash;
  };

  return result;
};


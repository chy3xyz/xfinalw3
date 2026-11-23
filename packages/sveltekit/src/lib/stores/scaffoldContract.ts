import { browser } from "$app/env"
import { getPublicClient, getWalletClient } from "@wagmi/core"
import type { GetWalletClientReturnType } from "@wagmi/core"
import { derived, get, readable } from "svelte/store"
import { Account, Chain, Client, Transport, getContract } from "viem"
import type { Address } from "viem"
import { wagmiContextStore } from "../contexts/wagmi.js"
import type { Contract, ContractName } from "../utils/contract.js"
import type { AllowedChainIds } from "../utils/networks.js"
import { createDeployedContractStore } from "./deployedContract.js"
import { useSelectedNetwork } from "./selectedNetwork.js"

/**
 * Gets a viem instance of the contract present in deployedContracts.ts or externalContracts.ts corresponding to
 * targetNetworks configured in scaffold.config.ts. Optional walletClient can be passed for doing write transactions.
 * @param config - The config settings for the hook
 * @param config.contractName - deployed contract name
 * @param config.walletClient - optional walletClient can be passed for doing write transactions
 * @param config.chainId - optional chainId that is configured with the scaffold project to make use for multi-chain interactions.
 */
export function createScaffoldContractStore<
  TContractName extends ContractName,
  TWalletClient extends Exclude<GetWalletClientReturnType, null> | undefined
>(config: {
  contractName: TContractName
  walletClient?: TWalletClient | null
  chainId?: AllowedChainIds
}) {
  const { contractName, walletClient, chainId } = config

  const selectedNetwork = useSelectedNetwork(chainId)
  const deployedContractStore = createDeployedContractStore({
    contractName,
    chainId: get(selectedNetwork).id as AllowedChainIds
  })

  const deployedContractData = derived(
    deployedContractStore,
    ($store) => $store.data
  )
  const isLoading = derived(deployedContractStore, ($store) => $store.isLoading)

  const clientsStore = readable(
    {
      publicClient: null as ReturnType<typeof getPublicClient> | null,
      walletClient: null as GetWalletClientReturnType | null
    },
    (set) => {
      if (!browser) return

      let cancelled = false

      const refresh = async () => {
        const { config: wagmiConfig } = get(wagmiContextStore)
        const network = get(selectedNetwork)
        if (!wagmiConfig) {
          if (!cancelled) set({ publicClient: null, walletClient: null })
          return
        }
        try {
          const publicClient = getPublicClient(wagmiConfig, {
            chainId: network.id
          })
          let wallet: GetWalletClientReturnType | null = null
          try {
            wallet = await getWalletClient(wagmiConfig, { chainId: network.id })
          } catch {
            wallet = null
          }
          if (!cancelled)
            set({ publicClient: publicClient ?? null, walletClient: wallet })
        } catch {
          if (!cancelled) set({ publicClient: null, walletClient: null })
        }
      }

      void refresh()
      const unsub = wagmiContextStore.subscribe(() => {
        void refresh()
      })

      return () => {
        cancelled = true
        unsub()
      }
    }
  )

  const contract = derived(
    [deployedContractData, clientsStore],
    ([$deployedContract, $clients]) => {
      const finalWalletClient = walletClient || $clients.walletClient
      const publicClient = $clients.publicClient

      if (!$deployedContract || !publicClient) {
        return undefined
      }

      return getContract<
        Transport,
        Address,
        Contract<TContractName>["abi"],
        TWalletClient extends Exclude<GetWalletClientReturnType, null>
          ? {
              public: Client<Transport, Chain>
              wallet: TWalletClient
            }
          : { public: Client<Transport, Chain> },
        Chain,
        Account
      >({
        address: $deployedContract.address,
        abi: $deployedContract.abi as Contract<TContractName>["abi"],
        client: {
          public: publicClient,
          wallet: finalWalletClient ? finalWalletClient : undefined
        } as any
      })
    }
  )

  return {
    data: contract,
    isLoading
  }
}

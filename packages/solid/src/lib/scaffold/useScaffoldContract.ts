import { createMemo, type Accessor } from "solid-js"
import { getDeployedContract } from "../contracts/index.js"
import { walletStore } from "../stores/wallet.js"
import { EXPECTED_CHAIN_ID } from "../web3/config.js"

/**
 * Reactive ABI/address lookup from deployedContracts (+ externalContracts).
 */
export function useScaffoldContract(opts: {
  contractName: string
  chainId?: number | Accessor<number | undefined>
}) {
  const chainId = () => {
    if (typeof opts.chainId === "function") {
      return opts.chainId() ?? walletStore.currentChainId() ?? EXPECTED_CHAIN_ID
    }
    return opts.chainId ?? walletStore.currentChainId() ?? EXPECTED_CHAIN_ID
  }

  const deployed = createMemo(() =>
    getDeployedContract({
      contractName: opts.contractName,
      chainId: chainId()
    })
  )

  return {
    chainId,
    deployed,
    address: () => deployed()?.address,
    abi: () => deployed()?.abi,
    isDeployed: () => Boolean(deployed())
  }
}

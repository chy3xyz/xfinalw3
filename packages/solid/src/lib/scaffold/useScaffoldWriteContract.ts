import { createSignal } from "solid-js"
import type { Abi, Address } from "viem"
import { getDeployedContract } from "../contracts/index.js"
import { notify } from "../stores/notify.js"
import { walletStore } from "../stores/wallet.js"
import { EXPECTED_CHAIN_ID } from "../web3/config.js"
import {
  classifyError,
  notifyTxSuccess,
  waitForTransaction,
  writeContract
} from "../web3/wallet.js"

type WriteOpts = {
  contractName: string
  chainId?: number
}

/**
 * Solid equivalent of Svelte `createScaffoldWriteContractStore`.
 */
export function useScaffoldWriteContract(opts: WriteOpts) {
  const [isMining, setIsMining] = createSignal(false)

  const writeContractAsync = async (vars: {
    functionName: string
    args?: readonly unknown[]
    value?: bigint
  }) => {
    const chainId =
      opts.chainId ?? walletStore.currentChainId() ?? EXPECTED_CHAIN_ID
    const deployed = getDeployedContract({
      contractName: opts.contractName,
      chainId
    })
    if (!deployed) {
      notify.error(
        `Contract ${opts.contractName} is not deployed — run bun deploy:local?`
      )
      return
    }
    if (!walletStore.walletAddress()) {
      notify.error("Please connect your wallet")
      return
    }
    setIsMining(true)
    try {
      const hash = await writeContract({
        address: deployed.address as Address,
        abi: deployed.abi as Abi,
        functionName: vars.functionName,
        args: [...(vars.args ?? [])],
        value: vars.value
      })
      await waitForTransaction(hash)
      notifyTxSuccess("Transaction confirmed")
      return hash
    } catch (e) {
      notify.error(classifyError(e))
      throw e
    } finally {
      setIsMining(false)
    }
  }

  return { isMining, writeContractAsync }
}

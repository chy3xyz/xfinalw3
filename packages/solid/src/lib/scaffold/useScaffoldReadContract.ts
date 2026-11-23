import {
  type Accessor,
  createEffect,
  createMemo,
  createSignal,
  onCleanup
} from "solid-js"
import type { Abi, Address } from "viem"
import { getDeployedContract } from "../contracts/index.js"
import { walletStore } from "../stores/wallet.js"
import { EXPECTED_CHAIN_ID } from "../web3/config.js"
import { readContract } from "../web3/wallet.js"

type ReadOpts = {
  contractName: string
  functionName: string
  args?: Accessor<readonly unknown[] | undefined> | readonly unknown[]
  watch?: boolean
  chainId?: number
  enabled?: Accessor<boolean> | boolean
}

/**
 * Solid equivalent of Svelte `createScaffoldReadContractStore`.
 * Loads ABI/address from deployedContracts by name.
 */
export function useScaffoldReadContract<T = unknown>(opts: ReadOpts) {
  const [data, setData] = createSignal<T | undefined>(undefined)
  const [error, setError] = createSignal<unknown>(null)
  const [isLoading, setIsLoading] = createSignal(true)

  const chainId = () =>
    opts.chainId ?? walletStore.currentChainId() ?? EXPECTED_CHAIN_ID
  const enabled = () =>
    typeof opts.enabled === "function"
      ? (opts.enabled as Accessor<boolean>)()
      : opts.enabled ?? true
  const args = () =>
    typeof opts.args === "function"
      ? (opts.args as Accessor<readonly unknown[] | undefined>)()
      : opts.args

  const deployed = createMemo(() =>
    getDeployedContract({
      contractName: opts.contractName,
      chainId: chainId()
    })
  )

  const refetch = async () => {
    if (!enabled()) {
      setIsLoading(false)
      return
    }
    const c = deployed()
    if (!c) {
      setError(
        new Error(`Contract ${opts.contractName} not deployed on ${chainId()}`)
      )
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const result = await readContract<T>({
        address: c.address as Address,
        abi: c.abi as Abi,
        functionName: opts.functionName,
        args: [...(args() ?? [])]
      })
      setData(() => result)
    } catch (e) {
      setError(e)
    } finally {
      setIsLoading(false)
    }
  }

  createEffect(() => {
    void chainId()
    void args()
    void enabled()
    void deployed()
    void refetch()
    if (opts.watch === false) return
    const id = window.setInterval(() => void refetch(), 12_000)
    onCleanup(() => clearInterval(id))
  })

  return {
    data,
    error,
    isLoading,
    isSuccess: () => data() !== undefined && !error(),
    refetch,
    deployed
  }
}

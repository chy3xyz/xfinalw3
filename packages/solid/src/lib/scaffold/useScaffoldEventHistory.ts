import {
  type Accessor,
  createEffect,
  createMemo,
  createSignal,
  onCleanup
} from "solid-js"
import type { Abi, AbiEvent, Address, Log } from "viem"
import { getDeployedContract } from "../contracts/index.js"
import { walletStore } from "../stores/wallet.js"
import { EXPECTED_CHAIN_ID } from "../web3/config.js"
import { getEventLogs, getBlockNumber } from "../web3/wallet.js"

export type ScaffoldEventLog = {
  args?: Record<string, unknown>
  blockNumber?: bigint
  transactionHash?: string
  logIndex?: number
}

type Opts = {
  contractName: string
  eventName: string
  /** Look back this many blocks from tip when fromBlock omitted (default 2_000). */
  blocksBack?: number
  fromBlock?: Accessor<bigint | undefined> | bigint
  enabled?: Accessor<boolean> | boolean
  watch?: boolean
  chainId?: number
}

function findAbiEvent(abi: Abi, eventName: string): AbiEvent | undefined {
  return abi.find(
    (item): item is AbiEvent =>
      item.type === "event" && item.name === eventName
  )
}

/**
 * Load historical logs for a named event on a deployed scaffold contract.
 */
export function useScaffoldEventHistory(opts: Opts) {
  const [data, setData] = createSignal<ScaffoldEventLog[]>([])
  const [error, setError] = createSignal<unknown>(null)
  const [isLoading, setIsLoading] = createSignal(true)

  const chainId = () =>
    opts.chainId ?? walletStore.currentChainId() ?? EXPECTED_CHAIN_ID
  const enabled = () =>
    typeof opts.enabled === "function"
      ? (opts.enabled as Accessor<boolean>)()
      : (opts.enabled ?? true)
  const fromBlockOpt = () =>
    typeof opts.fromBlock === "function"
      ? (opts.fromBlock as Accessor<bigint | undefined>)()
      : opts.fromBlock

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
    const event = findAbiEvent(c.abi as Abi, opts.eventName)
    if (!event) {
      setError(
        new Error(
          `Event ${opts.eventName} not found on ${opts.contractName} ABI`
        )
      )
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      let from = fromBlockOpt()
      if (from === undefined) {
        const tip = await getBlockNumber()
        const back = BigInt(opts.blocksBack ?? 2_000)
        from = tip > back ? tip - back : 0n
      }
      const logs = await getEventLogs({
        address: c.address as Address,
        event,
        fromBlock: from
      })
      setData(
        logs.map((log) => {
          const raw = log as Log & ScaffoldEventLog
          return {
            args: raw.args,
            blockNumber: raw.blockNumber,
            transactionHash: raw.transactionHash
              ? String(raw.transactionHash)
              : undefined,
            logIndex: raw.logIndex
          }
        })
      )
    } catch (e) {
      setError(e)
    } finally {
      setIsLoading(false)
    }
  }

  createEffect(() => {
    void chainId()
    void enabled()
    void deployed()
    void fromBlockOpt()
    void refetch()
    if (opts.watch === false) return
    const id = window.setInterval(() => void refetch(), 12_000)
    onCleanup(() => clearInterval(id))
  })

  return {
    data,
    error,
    isLoading,
    refetch,
    deployed
  }
}

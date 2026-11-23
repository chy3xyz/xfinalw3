import { walletConnect } from "@wagmi/connectors"
/**
 * Wallet + contract helpers for Xfinalw3 (@wagmi/solid actions).
 */
import type { Config } from "@wagmi/solid"
import {
  switchChain as _switchChain,
  writeContract as _writeContract,
  connect,
  disconnect,
  getConnections,
  reconnect,
  simulateContract,
  watchChainId,
  watchConnections
} from "@wagmi/solid/actions"
import type { Abi, AbiEvent, Address, Chain } from "viem"
import { formatEther, parseEther, parseUnits } from "viem"
import { t } from "../i18n/index.js"
import { notify } from "../stores/notify.js"
import { walletStore } from "../stores/wallet.js"
import { foundry, getPublicClient, localhost } from "./client.js"
import {
  CHAIN_CONFIG,
  DEFAULT_CHAIN,
  EXPECTED_CHAIN_ID,
  WALLETCONNECT_PROJECT_ID,
  config,
  walletConnectEnabled
} from "./config.js"
import { browserInjectedConnector, hasInjectedWallet } from "./injected.js"
import { ERC20_ABI } from "./tokens.js"

export { walletStore } from "../stores/wallet.js"

const STORAGE_KEY = "xfinalw3_wallet_address"

const CHAIN_MAP: Record<number, Chain> = {
  [foundry.id]: foundry,
  [localhost.id]: localhost
}

const CHAIN_KEY_MAP: Record<number, keyof typeof CHAIN_CONFIG> = {
  [foundry.id]: "foundry",
  [localhost.id]: "localhost"
}

export function getChainDisplayName(chain: Chain): string {
  const key = CHAIN_KEY_MAP[chain.id]
  return (key && CHAIN_CONFIG[key]?.name) || chain.name
}

export async function ensureTargetChain(opts?: {
  silent?: boolean
}): Promise<boolean> {
  const current = walletStore.currentChainId()
  if (current === EXPECTED_CHAIN_ID) return true
  try {
    await _switchChain(config as Config, { chainId: EXPECTED_CHAIN_ID })
    walletStore.setCurrentChainId(EXPECTED_CHAIN_ID)
    walletStore.setCurrentChainName(getChainDisplayName(DEFAULT_CHAIN))
    return true
  } catch (e) {
    if (!opts?.silent) console.warn("[ensureTargetChain] switch failed:", e)
    return false
  }
}

export function getConnectedAddress(): string | null {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return stored.toLowerCase()
  } catch {
    /* ignore */
  }
  const conns = getConnections(config as Config)
  return conns[0]?.accounts[0]?.toLowerCase() || null
}

async function connectWithConnector(
  connector:
    | ReturnType<typeof browserInjectedConnector>
    | ReturnType<typeof walletConnect>
): Promise<string> {
  walletStore.setWalletConnecting(true)
  try {
    const result = await connect(
      config as Config,
      {
        connector
      } as Parameters<typeof connect>[1]
    )
    const raw = result.accounts[0]
    const addr = (
      typeof raw === "string" ? raw : (raw as { address?: string })?.address
    )?.toLowerCase()
    if (!addr) throw new Error("No accounts")
    try {
      localStorage.setItem(STORAGE_KEY, addr)
    } catch {
      /* ignore */
    }
    walletStore.setWalletAddress(addr)
    walletStore.setCurrentChainId(result.chainId)
    walletStore.setCurrentChainName(
      getChainDisplayName(CHAIN_MAP[result.chainId] || DEFAULT_CHAIN)
    )
    if (result.chainId !== EXPECTED_CHAIN_ID) {
      const ok = await ensureTargetChain({ silent: true })
      if (!ok) notify.warning(t("wallet.wrongNetwork"))
    }
    return addr
  } finally {
    walletStore.setWalletConnecting(false)
  }
}

export async function connectWallet(): Promise<string> {
  if (!hasInjectedWallet()) {
    if (walletConnectEnabled()) return connectWalletWC()
    throw new Error("NO_INJECTED_WALLET")
  }
  return connectWithConnector(browserInjectedConnector())
}

export async function connectWalletWC(): Promise<string> {
  if (!walletConnectEnabled()) throw new Error("WALLETCONNECT_NOT_CONFIGURED")
  return connectWithConnector(
    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
      showQrModal: true,
      metadata: {
        name: "Xfinalw3",
        description: "Xfinalw3 Solid dApp scaffold",
        url:
          typeof window !== "undefined"
            ? window.location.origin
            : "http://localhost:5173",
        icons: []
      }
    })
  )
}

export async function connectWalletSafe(): Promise<string | null> {
  try {
    return await connectWallet()
  } catch (e: unknown) {
    const msg = classifyError(e)
    if (msg) notify.error(msg)
    return null
  }
}

export async function disconnectWallet(): Promise<void> {
  try {
    await disconnect(config as Config)
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  walletStore.setWalletAddress(null)
  walletStore.setWalletConnecting(false)
}

export async function switchChain(chainKey: string): Promise<void> {
  const map: Record<string, Chain> = { foundry, localhost }
  const chain = map[chainKey] || foundry
  await _switchChain(config as Config, { chainId: chain.id })
  walletStore.setCurrentChainId(chain.id)
  walletStore.setCurrentChainName(getChainDisplayName(chain))
}

export async function readContract<T = unknown>({
  address,
  abi,
  functionName,
  args = []
}: {
  address: Address
  abi: Abi
  functionName: string
  args?: unknown[]
}): Promise<T> {
  const chainId = walletStore.currentChainId()
  const chain = CHAIN_MAP[chainId] || DEFAULT_CHAIN
  const client = getPublicClient(chain)
  return client.readContract({
    address,
    abi,
    functionName,
    args
  } as never) as Promise<T>
}

export async function writeContract({
  address,
  abi,
  functionName,
  args = [],
  value
}: {
  address: Address
  abi: Abi
  functionName: string
  args?: unknown[]
  value?: bigint
}): Promise<`0x${string}`> {
  const connections = getConnections(config as Config)
  const connector = connections[0]?.connector
  const account = connections[0]?.accounts[0]
  if (!account) throw new Error("Wallet not connected")
  const ok = await ensureTargetChain({ silent: true })
  if (!ok && walletStore.currentChainId() !== EXPECTED_CHAIN_ID) {
    throw new Error("WRONG_NETWORK")
  }
  const { request } = await simulateContract(
    config as Config,
    {
      address,
      abi,
      functionName,
      args,
      account,
      value,
      connector
    } as never
  )
  return _writeContract(config as Config, request as never)
}

export async function getTokenBalance(
  tokenAddress: Address,
  owner: Address
): Promise<string> {
  const bal = await readContract<bigint>({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [owner]
  })
  return formatEther(bal)
}

export async function waitForTransaction(
  hash: `0x${string}`
): Promise<{ status: "success" | "reverted" }> {
  const client = getPublicClient()
  return client.waitForTransactionReceipt({ hash })
}

export function classifyError(e: unknown): string {
  const err = e as { shortMessage?: string; message?: string; code?: number }
  const msg = err?.shortMessage || err?.message || String(e)
  const lower = msg.toLowerCase()
  if (msg === "NO_INJECTED_WALLET" || lower.includes("no_injected_wallet"))
    return t("wallet.noInjected")
  if (
    msg === "WALLETCONNECT_NOT_CONFIGURED" ||
    lower.includes("walletconnect_not_configured")
  )
    return t("wallet.wcNotConfigured")
  if (msg === "WRONG_NETWORK" || lower.includes("wrong_network"))
    return t("wallet.wrongNetwork")
  if (
    lower.includes("user rejected") ||
    lower.includes("user denied") ||
    err?.code === 4001
  )
    return t("wallet.rejected")
  if (lower.includes("insufficient funds") || lower.includes("exceeds balance"))
    return t("wallet.insufficient")
  if (lower.includes("execution reverted") || lower.includes("reverted"))
    return t("errors.reverted")
  return t("errors.network")
}

export function notifyTxSuccess(message: string) {
  notify.success(message, { timeout: 5000 })
}

export async function getBlockNumber(): Promise<bigint> {
  const chain = CHAIN_MAP[walletStore.currentChainId()] || DEFAULT_CHAIN
  return BigInt(await getPublicClient(chain).getBlockNumber())
}

export async function getEventLogs(opts: {
  address: Address
  event: AbiEvent
  fromBlock: bigint
  toBlock?: bigint | "latest"
}): Promise<Array<{ args?: Record<string, unknown> }>> {
  const chain = CHAIN_MAP[walletStore.currentChainId()] || DEFAULT_CHAIN
  const logs = await getPublicClient(chain).getLogs({
    address: opts.address,
    event: opts.event,
    fromBlock: opts.fromBlock,
    toBlock: opts.toBlock ?? "latest"
  } as never)
  return logs as unknown as Array<{ args?: Record<string, unknown> }>
}

let _listenersAttached = false

export async function setupWalletListeners(): Promise<void> {
  if (typeof window === "undefined" || _listenersAttached) return
  _listenersAttached = true

  try {
    await reconnect(config as Config)
  } catch {
    /* ignore */
  }

  const sync = () => {
    const conns = getConnections(config as Config)
    const conn = conns[0]
    const addr = conn?.accounts[0]?.toLowerCase() || null
    walletStore.setWalletAddress(addr)
    walletStore.setWalletConnecting(false)
    if (addr) {
      try {
        localStorage.setItem(STORAGE_KEY, addr)
      } catch {
        /* ignore */
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* ignore */
      }
    }
    if (conn?.chainId) {
      walletStore.setCurrentChainId(conn.chainId)
      walletStore.setCurrentChainName(
        getChainDisplayName(CHAIN_MAP[conn.chainId] || DEFAULT_CHAIN)
      )
    }
  }
  sync()

  watchConnections(config as Config, { onChange: sync })
  watchChainId(config as Config, {
    onChange: (chainId: number) => {
      walletStore.setCurrentChainId(chainId)
      walletStore.setCurrentChainName(
        getChainDisplayName(CHAIN_MAP[chainId] || DEFAULT_CHAIN)
      )
    }
  })
}

export { hasInjectedWallet } from "./injected.js"
export {
  foundry,
  localhost,
  formatEther,
  parseEther,
  parseUnits,
  getPublicClient
}

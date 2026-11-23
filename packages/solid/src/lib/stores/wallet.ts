import { useChainId, useConnection } from "@wagmi/solid"
import { createEffect, createMemo, createSignal } from "solid-js"
import { EXPECTED_CHAIN_ID } from "../web3/config.js"

const [walletAddress, setWalletAddress] = createSignal<string | null>(null)
const [walletConnecting, setWalletConnecting] = createSignal(false)
const [currentChainName, setCurrentChainName] = createSignal("Foundry")
const [currentChainId, setCurrentChainId] =
  createSignal<number>(EXPECTED_CHAIN_ID)
const [inviteCode, setInviteCode] = createSignal<string | null>(null)

export const walletStore = {
  walletAddress,
  setWalletAddress,
  walletConnecting,
  setWalletConnecting,
  currentChainName,
  setCurrentChainName,
  currentChainId,
  setCurrentChainId,
  inviteCode,
  setInviteCode
}

/** Normalize @wagmi/solid useConnection() which may be a store-like object. */
function connectionSnapshot(connection: unknown): {
  address?: string
  addresses?: readonly string[]
  chainId?: number
  isConnected?: boolean
} {
  if (connection == null) return {}
  if (typeof connection === "function") {
    try {
      return (connection as () => object)() as ReturnType<
        typeof connectionSnapshot
      >
    } catch {
      return {}
    }
  }
  return connection as ReturnType<typeof connectionSnapshot>
}

export function useWalletStore() {
  const connection = useConnection()
  const chainId = useChainId()

  const address = createMemo(() => {
    const snap = connectionSnapshot(connection)
    const fromList = snap.addresses?.[0]
    const single = snap.address
    return (fromList || single || null)?.toLowerCase() ?? null
  })

  createEffect(() => {
    const addr = address()
    setWalletAddress(addr)
    const snap = connectionSnapshot(connection)
    const cid =
      (typeof chainId === "function" ? chainId() : (chainId as number)) ??
      snap.chainId ??
      EXPECTED_CHAIN_ID
    setCurrentChainId(cid)
    if (!addr) setInviteCode(null)
  })

  return {
    address,
    status: () => (address() ? "connected" : "disconnected"),
    chainId: () => currentChainId(),
    inviteCode,
    walletConnecting
  }
}

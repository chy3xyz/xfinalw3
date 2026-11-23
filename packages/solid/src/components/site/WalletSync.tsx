// Sync wagmi connection into walletStore (must run under WagmiProvider).
import { useWalletStore } from "~/lib/stores/wallet"

export function WalletSync() {
  useWalletStore()
  return null
}

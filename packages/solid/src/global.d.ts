/// <reference types="vite/client" />

interface Window {
  ethereum?: {
    isOkxWallet?: boolean
    providers?: unknown[]
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  }
  okxwallet?: Window["ethereum"]
  BinanceChain?: Window["ethereum"]
}

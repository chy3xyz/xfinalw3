// OKX / TokenPocket / MetaMask / 币安 Web3 等浏览器注入钱包探测
import { injected } from "@wagmi/solid"

type Eip1193 = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  isOkxWallet?: boolean
  providers?: Eip1193[]
}

function isOkx(eth: Eip1193 | undefined): boolean {
  return !!eth?.isOkxWallet
}

/** 解析当前环境可用的 EIP-1193 provider（含 OKX 独立注入 `window.okxwallet`） */
export function getInjectedProvider(): Eip1193 | null {
  if (typeof window === "undefined") return null
  const w = window as Window & { okxwallet?: Eip1193; BinanceChain?: Eip1193 }

  if (w.okxwallet) return w.okxwallet

  const eth = w.ethereum as Eip1193 | undefined
  if (!eth) return w.BinanceChain ?? null

  if (isOkx(eth)) return eth

  if (Array.isArray(eth.providers)) {
    const okx = eth.providers.find(isOkx)
    if (okx) return okx
  }

  return eth
}

export function hasInjectedWallet(): boolean {
  return getInjectedProvider() != null
}

function injectedTarget() {
  const provider = getInjectedProvider()
  if (!provider) return undefined

  const w = window as Window & { okxwallet?: Eip1193; BinanceChain?: Eip1193 }
  if (w.okxwallet && provider === w.okxwallet) {
    return { id: "okxwallet", name: "OKX Wallet", provider }
  }
  if (w.BinanceChain && provider === w.BinanceChain) {
    return { id: "binance", name: "Binance Web3 Wallet", provider }
  }
  if (isOkx(provider)) {
    return { id: "okxwallet", name: "OKX Wallet", provider }
  }
  return { id: "injected", name: "Browser Wallet", provider }
}

/** wagmi injected connector，自动识别 OKX / 币安 / 通用 ethereum */
export function browserInjectedConnector() {
  return injected({
    shimDisconnect: true,
    unstable_shimAsyncInject: 2_000,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: (() => injectedTarget()) as any
  })
}

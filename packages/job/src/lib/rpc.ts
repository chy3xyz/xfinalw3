/**
 * Shared RPC / infra helpers for Bun keepers (extracted from mmm job/lib/rpc.mjs).
 *
 * - requireEnv / envMs — fail-fast + safe ms parsing (never Number('10_000'))
 * - makeClients / makeReadClient — viem public/wallet pair
 * - waitTx — receipt + revert detection
 * - signWebhookBody — HMAC-SHA256 for outbound webhooks
 */
import { createHmac } from "node:crypto"
import {
  http,
  type Account,
  type Chain,
  type Hex,
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { foundry } from "viem/chains"
import { logger } from "../utils/logger.js"

export const TX_TIMEOUT_MS = 180_000
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

export function requireEnv(
  name: string,
  value: string | undefined
): asserts value is string {
  if (!value || value === ZERO_ADDRESS) {
    logger.error(`Missing env: ${name}`)
    process.exit(1)
  }
}

/** Parse positive ms from env; invalid values fall back with a WARN (never NaN). */
export function envMs(name: string, fallbackMs: number): number {
  const raw = process.env[name]
  if (raw === undefined || raw === "") return fallbackMs
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) {
    logger.warn(
      `${name}="${raw}" is not a positive number — falling back to ${fallbackMs}ms`
    )
    return fallbackMs
  }
  return n
}

export function makeClients(
  rpcUrl: string,
  privateKey: string,
  chain: Chain = foundry
): {
  publicClient: PublicClient
  walletClient: WalletClient
  account: Account
} {
  const pk = (
    privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`
  ) as Hex
  const account = privateKeyToAccount(pk)
  const transport = http(rpcUrl)
  const publicClient = createPublicClient({ chain, transport })
  const walletClient = createWalletClient({ account, chain, transport })
  return { publicClient, walletClient, account }
}

export function makeReadClient(
  rpcUrl: string,
  chain: Chain = foundry
): PublicClient {
  return createPublicClient({ chain, transport: http(rpcUrl) })
}

export async function waitTx(
  publicClient: PublicClient,
  hash: Hex,
  label: string
) {
  logger.info(`${label} sent: ${hash}`)
  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
    timeout: TX_TIMEOUT_MS
  })
  if (receipt.status !== "success") {
    throw new Error(`${label} reverted: ${hash}`)
  }
  logger.info(`${label} ok gas=${receipt.gasUsed} block=${receipt.blockNumber}`)
  return receipt
}

/** `sha256=<hex>` header value for webhook authenticity. */
export function signWebhookBody(body: string | Buffer, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`
}

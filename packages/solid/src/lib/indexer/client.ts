/**
 * Indexer GraphQL client (from mmm ponder/client — timeout + one retry).
 */

export const INDEXER_GRAPHQL_URL =
  (import.meta.env.VITE_PONDER_GRAPHQL_URL as string | undefined)?.trim() ||
  "/api/graphql"

export class IndexerError extends Error {
  constructor(
    message: string,
    public readonly errors?: unknown
  ) {
    super(message)
    this.name = "IndexerError"
  }
}

const TIMEOUT_MS = Number(import.meta.env.VITE_PONDER_TIMEOUT_MS || 12_000)
const RETRY = 1

async function fetchWithTimeout(
  url: string,
  init: RequestInit
): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function post<T>(
  url: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const init: RequestInit = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables })
  }
  let res: Response
  try {
    res = await fetchWithTimeout(url, init)
  } catch (e) {
    if (RETRY > 0) {
      await new Promise((r) => setTimeout(r, 400))
      try {
        res = await fetchWithTimeout(url, init)
      } catch (e2) {
        const msg =
          (e2 as Error)?.name === "AbortError"
            ? "timeout"
            : String((e2 as Error)?.message || e2)
        throw new IndexerError(`Indexer ${msg}（${TIMEOUT_MS}ms）`)
      }
    } else {
      throw new IndexerError(`Indexer ${String((e as Error)?.message || e)}`)
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new IndexerError(`Indexer HTTP ${res.status}: ${text.slice(0, 200)}`)
  }

  const json = (await res.json()) as {
    data?: T
    errors?: { message?: string }[]
  }
  if (json.errors?.length) {
    throw new IndexerError(
      json.errors.map((e) => e.message || "GraphQL error").join("; "),
      json.errors
    )
  }
  if (json.data === undefined) {
    throw new IndexerError("Indexer returned empty data")
  }
  return json.data
}

export async function indexerGraphql<T = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  return post<T>(INDEXER_GRAPHQL_URL, query, variables)
}

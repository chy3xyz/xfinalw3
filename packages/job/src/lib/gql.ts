/**
 * GraphQL + internal-endpoint helpers for keepers
 * (extracted from mmm job/lib/gql.mjs).
 */

/** Tolerate both ponder `{items:[...]}` shapes and raw arrays. */
export function rowsOf(
  data: Record<string, unknown> | null | undefined,
  name: string
): unknown[] {
  const v = data?.[name]
  if (Array.isArray(v)) return v
  if (
    v &&
    typeof v === "object" &&
    Array.isArray((v as { items?: unknown }).items)
  ) {
    return (v as { items: unknown[] }).items
  }
  return []
}

function trimBase(baseUrl: string): string {
  return String(baseUrl || "").replace(/\/+$/, "")
}

/** Bind a minimal GraphQL client to a Ponder/bponder API base URL. */
export function makeGql(baseUrl: string) {
  const base = trimBase(baseUrl)
  return async function gql(
    query: string,
    variables: Record<string, unknown> = {}
  ): Promise<Record<string, unknown>> {
    if (!base) throw new Error("graphql: empty base URL")
    const res = await fetch(`${base}/graphql`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, variables })
    })
    if (!res.ok) throw new Error(`graphql http ${res.status}`)
    const json = (await res.json()) as {
      data?: Record<string, unknown>
      errors?: { message?: string }[]
    }
    if (json.errors?.length) {
      throw new Error(json.errors.map((e) => e.message || "error").join("; "))
    }
    return json.data ?? {}
  }
}

/** Headers for keeper → indexer machine calls. */
export function keeperHeaders(
  secret: string | undefined,
  extra: Record<string, string> = {}
): Record<string, string> {
  return {
    "content-type": "application/json",
    ...(secret ? { "x-keeper-secret": secret } : {}),
    ...extra
  }
}

/**
 * POST JSON to an internal endpoint. Never throws on HTTP errors —
 * returns {ok,status,data} so tick loops can log-and-continue.
 */
export async function postInternal(
  baseUrl: string,
  path: string,
  body: unknown,
  secret?: string
): Promise<{
  ok: boolean
  status: number
  data: unknown
  error?: string
}> {
  const base = trimBase(baseUrl)
  let res: Response
  try {
    res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: keeperHeaders(secret),
      body: JSON.stringify(body)
    })
  } catch (e) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: e instanceof Error ? e.message : String(e)
    }
  }
  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    /* non-JSON ok */
  }
  return { ok: res.ok, status: res.status, data }
}

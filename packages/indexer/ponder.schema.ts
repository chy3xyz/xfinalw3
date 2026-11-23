import { onchainTable } from "ponder"

/** Placeholder table so schema is non-empty; replace when indexing contracts. */
export const meta = onchainTable("meta", (t) => ({
  key: t.text().primaryKey(),
  value: t.text().notNull()
}))

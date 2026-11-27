import { onchainTable } from "bponder"

/** Heartbeat / ops key-value (always present). */
export const meta = onchainTable("meta", (t) => ({
  key: t.text().primaryKey(),
  value: t.text().notNull()
}))

/** Counter.CountUpdated rows — framework sample table. */
export const countUpdate = onchainTable("count_update", (t) => ({
  id: t.text().primaryKey(),
  newCount: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull()
}))

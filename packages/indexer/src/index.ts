import { ponder } from "bponder:registry"
import { countUpdate, meta } from "bponder:schema"
import { counterConfigured } from "./counterConfigured"

ponder.on("Heartbeat:block", async ({ event, context }) => {
  await context.db
    .insert(meta)
    .values({
      key: "last_heartbeat_block",
      value: event.block.number.toString()
    })
    .onConflictDoUpdate({
      value: event.block.number.toString()
    })
})

if (counterConfigured()) {
  ponder.on("Counter:CountUpdated", async ({ event, context }) => {
    await context.db.insert(countUpdate).values({
      id: `${event.transaction.hash}-${event.log.logIndex}`,
      newCount: event.args.newCount,
      blockNumber: event.block.number,
      timestamp: event.block.timestamp
    })
  })
}

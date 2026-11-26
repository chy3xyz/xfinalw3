import { ponder } from "bponder:registry"
import { meta } from "bponder:schema"

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

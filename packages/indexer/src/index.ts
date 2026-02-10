import { ponder } from "ponder:registry";

// Example: Handle block events
ponder.on("block", async ({ context }) => {
  // Your indexing logic here
  // Access context.db, context.chain, context.client, etc.
});

// Example: Handle contract events (uncomment and configure when you add contracts)
// ponder.on("ContractName:EventName", async ({ event, context }) => {
//   await context.db.insert(tableName).values({
//     // your data here
//   });
// });

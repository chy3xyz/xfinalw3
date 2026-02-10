import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { count, desc, eq, graphql, or, replaceBigInts } from "ponder";
import { formatEther, getAddress } from "viem";

const app = new Hono();

// Enable GraphQL endpoint
app.use("/graphql", graphql({ db, schema }));

// Example: Get total count
app.get("/count", async (c) => {
  // This is a placeholder - update based on your schema
  return c.text("0");
});

// Example: Get count by address
app.get("/count/:address", async (c) => {
  const account = getAddress(c.req.param("address"));
  // This is a placeholder - update based on your schema
  return c.text("0");
});

// Health check endpoint
app.get("/health", async (c) => {
  return c.json({ status: "ok" });
});

export default app;


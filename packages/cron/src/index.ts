import { ContractJob } from "./jobs/contract-job.js";
import { logger } from "./utils/logger.js";
import { schedule } from "./utils/schedule.js";

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL || "http://localhost:8545";
const CHAIN_ID = parseInt(process.env.CHAIN_ID || "31337", 10);

if (!PRIVATE_KEY) {
  logger.error("PRIVATE_KEY environment variable is required");
  process.exit(1);
}

logger.info("Starting cron jobs...");
logger.info(`RPC URL: ${RPC_URL}`);
logger.info(`Chain ID: ${CHAIN_ID}`);

const contractJob = new ContractJob({
  privateKey: PRIVATE_KEY as `0x${string}`,
  rpcUrl: RPC_URL,
  chainId: CHAIN_ID,
});

const jobs = [
  schedule("* * * * *", async () => {
    logger.info("Running contract job...");
    await contractJob.execute();
  }),
  schedule("*/5 * * * *", async () => {
    logger.info("Running periodic read job...");
    await contractJob.periodicRead();
  }),
  schedule("0 2 * * *", async () => {
    logger.info("Running daily job...");
    await contractJob.dailyTask();
  }),
];

logger.info("Cron jobs scheduled. Press Ctrl+C to stop.");

function shutdown() {
  logger.info("Shutting down...");
  for (const job of jobs) job.stop();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

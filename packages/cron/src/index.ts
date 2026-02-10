import "dotenv/config";
import cron from "node-cron";
import { ContractJob } from "./jobs/contract-job.js";
import { logger } from "./utils/logger.js";

// 加载环境变量
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL || "http://localhost:8545";
const CHAIN_ID = parseInt(process.env.CHAIN_ID || "31337");

if (!PRIVATE_KEY) {
  logger.error("PRIVATE_KEY environment variable is required");
  process.exit(1);
}

logger.info("Starting cron jobs...");
logger.info(`RPC URL: ${RPC_URL}`);
logger.info(`Chain ID: ${CHAIN_ID}`);

// 初始化合约任务
const contractJob = new ContractJob({
  privateKey: PRIVATE_KEY as `0x${string}`,
  rpcUrl: RPC_URL,
  chainId: CHAIN_ID,
});

// 定义定时任务
// 每分钟执行一次（示例）
cron.schedule("* * * * *", async () => {
  logger.info("Running contract job...");
  try {
    await contractJob.execute();
  } catch (error) {
    logger.error("Error executing contract job:", error);
  }
});

// 每5分钟执行一次（示例）
cron.schedule("*/5 * * * *", async () => {
  logger.info("Running periodic read job...");
  try {
    await contractJob.periodicRead();
  } catch (error) {
    logger.error("Error reading contract data:", error);
  }
});

// 每天凌晨2点执行（示例）
cron.schedule("0 2 * * *", async () => {
  logger.info("Running daily job...");
  try {
    await contractJob.dailyTask();
  } catch (error) {
    logger.error("Error executing daily task:", error);
  }
});

logger.info("Cron jobs scheduled. Press Ctrl+C to stop.");

// 优雅退出
process.on("SIGINT", () => {
  logger.info("Shutting down...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("Shutting down...");
  process.exit(0);
});


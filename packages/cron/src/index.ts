import { startHealthServer, writesEnabled } from "./health.js"
import { ContractJob } from "./jobs/contract-job.js"
import { logger } from "./utils/logger.js"
import { drainInFlight, schedule } from "./utils/schedule.js"

const PRIVATE_KEY = process.env.PRIVATE_KEY
const RPC_URL = process.env.RPC_URL || "http://localhost:8545"
const CHAIN_ID = parseInt(process.env.CHAIN_ID || "31337", 10)
const DRAIN_TIMEOUT_MS = parseInt(
  process.env.CRON_DRAIN_TIMEOUT_MS || "30000",
  10
)

if (!PRIVATE_KEY) {
  logger.error("PRIVATE_KEY environment variable is required")
  process.exit(1)
}

if (!process.env.CONTRACT_ADDRESS) {
  logger.error("CONTRACT_ADDRESS environment variable is required")
  process.exit(1)
}

logger.info("Starting cron jobs...")
logger.info(`RPC URL: ${RPC_URL}`)
logger.info(`Chain ID: ${CHAIN_ID}`)
logger.info(`Writes enabled: ${writesEnabled()}`)

const healthServer = startHealthServer()

const contractJob = new ContractJob({
  privateKey: PRIVATE_KEY as `0x${string}`,
  rpcUrl: RPC_URL,
  chainId: CHAIN_ID
})

const jobs = [
  schedule("* * * * *", async () => {
    logger.info("Running contract job...")
    await contractJob.execute()
  }),
  schedule("*/5 * * * *", async () => {
    logger.info("Running periodic read job...")
    await contractJob.periodicRead()
  }),
  schedule("0 2 * * *", async () => {
    logger.info("Running daily job...")
    await contractJob.dailyTask()
  })
]

logger.info("Cron jobs scheduled. Press Ctrl+C to stop.")

let shuttingDown = false

async function shutdown(signal: string) {
  if (shuttingDown) return
  shuttingDown = true

  logger.info(`Shutting down (${signal})...`)
  for (const job of jobs) job.stop()

  const drained = await drainInFlight(DRAIN_TIMEOUT_MS)
  if (!drained) {
    logger.warn(`Drain timed out after ${DRAIN_TIMEOUT_MS}ms; exiting`)
  } else {
    logger.info("In-flight jobs drained")
  }

  healthServer.stop()
  process.exit(drained ? 0 : 1)
}

process.on("SIGINT", () => {
  void shutdown("SIGINT")
})
process.on("SIGTERM", () => {
  void shutdown("SIGTERM")
})

import { Cron } from "croner"
import { logger } from "./logger.js"

const inFlight = new Set<Promise<void>>()

export function schedule(
  expression: string,
  fn: () => void | Promise<void>
): { stop: () => void } {
  const job = new Cron(expression, { protect: true }, () => {
    const run = Promise.resolve()
      .then(() => fn())
      .catch((error) => {
        logger.error("scheduled job failed:", error)
      })
      .finally(() => {
        inFlight.delete(run)
      })
    inFlight.add(run)
  })
  return {
    stop: () => job.stop()
  }
}

/** Await in-flight jobs up to timeoutMs. Returns true if all drained. */
export async function drainInFlight(timeoutMs = 30_000): Promise<boolean> {
  if (inFlight.size === 0) return true

  const all = Promise.allSettled([...inFlight])
  let timedOut = false

  await Promise.race([
    all,
    new Promise<void>((resolve) => {
      setTimeout(() => {
        timedOut = true
        resolve()
      }, timeoutMs)
    })
  ])

  return !timedOut
}

export function inFlightCount(): number {
  return inFlight.size
}

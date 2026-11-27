/**
 * Cron logger — text in local/dev, JSON when LOG_FORMAT=json or NODE_ENV=production.
 */
type Level = "info" | "error" | "warn" | "debug"

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
}

function useJson(): boolean {
  const flag = process.env.LOG_FORMAT
  if (flag === "json") return true
  if (flag === "text") return false
  return (process.env.NODE_ENV || "").toLowerCase() === "production"
}

function emit(level: Level, message: string, args: unknown[]) {
  if (level === "debug" && process.env.DEBUG !== "true") return
  const ts = new Date().toISOString()
  if (useJson()) {
    const extra =
      args.length === 1 && typeof args[0] === "object" && args[0] !== null
        ? (args[0] as Record<string, unknown>)
        : args.length
          ? { args }
          : {}
    const line = {
      ts,
      level,
      svc: "cron",
      msg: message,
      ...extra
    }
    const out = JSON.stringify(line)
    if (level === "error") console.error(out)
    else if (level === "warn") console.warn(out)
    else console.log(out)
    return
  }
  const color =
    level === "error"
      ? colors.red
      : level === "warn"
        ? colors.yellow
        : level === "debug"
          ? colors.blue
          : colors.green
  const prefix = `${colors.cyan}[${ts}]${colors.reset} ${color}${level.toUpperCase()}${colors.reset}`
  if (level === "error") console.error(prefix, message, ...args)
  else if (level === "warn") console.warn(prefix, message, ...args)
  else console.log(prefix, message, ...args)
}

export const logger = {
  info: (message: string, ...args: unknown[]) => emit("info", message, args),
  error: (message: string, ...args: unknown[]) => emit("error", message, args),
  warn: (message: string, ...args: unknown[]) => emit("warn", message, args),
  debug: (message: string, ...args: unknown[]) => emit("debug", message, args)
}

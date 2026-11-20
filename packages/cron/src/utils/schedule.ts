import { Cron } from "croner";

export function schedule(
  expression: string,
  fn: () => void | Promise<void>,
): { stop: () => void } {
  const job = new Cron(expression, { protect: true }, () => {
    void Promise.resolve(fn()).catch((error) => {
      console.error("scheduled job failed:", error);
    });
  });
  return {
    stop: () => job.stop(),
  };
}

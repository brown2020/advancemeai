import { logger } from "@/utils/logger";

export async function measureAsyncPerformance<T>(
  fn: () => Promise<T>,
  label: string
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();

  logger.debug(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);

  return result;
}

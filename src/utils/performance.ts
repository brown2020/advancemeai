export function measurePerformance<T>(fn: () => T, label: string): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();

  console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);

  return result;
}

export async function measureAsyncPerformance<T>(
  fn: () => Promise<T>,
  label: string
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();

  console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);

  return result;
}

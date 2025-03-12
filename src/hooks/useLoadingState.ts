import { useState, useCallback } from "react";

interface UseLoadingStateOptions {
  initialLoading?: boolean;
  initialError?: string | null;
}

/**
 * A custom hook for managing loading states and errors
 *
 * @example
 * const { isLoading, error, startLoading, stopLoading, setError, withLoading } = useLoadingState();
 *
 * // Use with async functions
 * const fetchData = async () => {
 *   return withLoading(async () => {
 *     const data = await api.getData();
 *     return data;
 *   });
 * };
 */
export function useLoadingState({
  initialLoading = false,
  initialError = null,
}: UseLoadingStateOptions = {}) {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(initialError);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback((err: string | null = null) => {
    setIsLoading(false);
    setError(err);
  }, []);

  /**
   * Executes an async function with loading state management
   * Sets isLoading to true before execution and false after
   * Sets error if the function throws
   */
  const withLoading = useCallback(
    async <T>(
      fn: () => Promise<T>,
      errorMessage = "An error occurred. Please try again."
    ): Promise<T> => {
      startLoading();

      try {
        const result = await fn();
        stopLoading();
        return result;
      } catch (err) {
        console.error("Error in withLoading:", err);
        stopLoading(errorMessage);
        throw err;
      }
    },
    [startLoading, stopLoading]
  );

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setError,
    withLoading,
  };
}

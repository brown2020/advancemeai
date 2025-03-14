import { useState, useCallback, useEffect } from "react";
import { tryCatch, AppError, logError } from "@/utils/errorUtils";

interface UseApiRequestOptions<T> {
  /** Initial data value */
  initialData?: T;
  /** Whether to fetch data on mount */
  fetchOnMount?: boolean;
  /** Function to execute on mount */
  onMount?: () => Promise<T>;
  /** Error message to display if the request fails */
  errorMessage?: string;
  /** Whether to log errors */
  logErrors?: boolean;
}

/**
 * Hook for handling API requests with loading, error, and data states
 *
 * @example
 * const { data, isLoading, error, execute } = useApiRequest<User[]>({
 *   fetchOnMount: true,
 *   onMount: () => fetchUsers(),
 * });
 */
export function useApiRequest<T>(options: UseApiRequestOptions<T> = {}) {
  const {
    initialData,
    fetchOnMount = false,
    onMount,
    errorMessage = "Failed to fetch data. Please try again.",
    logErrors = true,
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(fetchOnMount);
  const [error, setError] = useState<string | null>(null);

  /**
   * Execute an API request and handle loading, error, and data states
   */
  const execute = useCallback(
    async <R>(
      fn: () => Promise<R>,
      customErrorMessage?: string
    ): Promise<[R | null, AppError | null]> => {
      setIsLoading(true);
      setError(null);

      const [result, error] = await tryCatch(fn, (err) => {
        if (logErrors) {
          logError(err);
        }
      });

      setIsLoading(false);

      if (error) {
        setError(customErrorMessage || errorMessage);
        return [null, error];
      }

      return [result, null];
    },
    [errorMessage, logErrors]
  );

  /**
   * Execute an API request and update the data state
   */
  const executeAndSetData = useCallback(
    async <R extends T>(
      fn: () => Promise<R>,
      customErrorMessage?: string
    ): Promise<boolean> => {
      const [result, error] = await execute(fn, customErrorMessage);

      if (error) {
        return false;
      }

      setData(result as T);
      return true;
    },
    [execute]
  );

  // Fetch data on mount if requested
  useEffect(() => {
    if (fetchOnMount && onMount) {
      executeAndSetData(onMount);
    }
  }, [fetchOnMount, onMount, executeAndSetData]);

  return {
    data,
    isLoading,
    error,
    setData,
    setError,
    execute,
    executeAndSetData,
    reset: useCallback(() => {
      setData(initialData);
      setIsLoading(false);
      setError(null);
    }, [initialData]),
  };
}

"use client";

import { useState, useCallback, useRef } from "react";

/**
 * Hook for handling streaming responses from AI endpoints
 * Provides consistent streaming logic across components with abort support
 *
 * @example
 * ```tsx
 * const { isStreaming, content, streamResponse, abort } = useStreamingResponse();
 *
 * const handleClick = async () => {
 *   const response = await fetch('/api/ai/explain', { method: 'POST', body: ... });
 *   const result = await streamResponse(response);
 *   if (result) {
 *     // Parse or use the final result
 *   }
 * };
 * ```
 */
export function useStreamingResponse() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Abort the current streaming response
   */
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  /**
   * Stream a response and update content in real-time
   * @param response - Fetch response with readable body stream
   * @returns The complete streamed content, or null if failed
   */
  const streamResponse = useCallback(
    async (response: Response): Promise<string | null> => {
      if (!response.ok) {
        setError(`Request failed: ${response.statusText}`);
        return null;
      }

      if (!response.body) {
        setError("No response body");
        return null;
      }

      // Cancel any previous stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsStreaming(true);
      setContent("");
      setError(null);

      try {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = "";

        while (true) {
          if (controller.signal.aborted) {
            reader.cancel();
            return null;
          }
          const { value, done } = await reader.read();
          if (done) break;
          result += decoder.decode(value);
          setContent(result);
        }

        setIsStreaming(false);
        abortControllerRef.current = null;
        return result;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // Stream was intentionally aborted
          setIsStreaming(false);
          return null;
        }
        setError(err instanceof Error ? err.message : "Streaming failed");
        setIsStreaming(false);
        abortControllerRef.current = null;
        return null;
      }
    },
    []
  );

  /**
   * Reset the streaming state
   */
  const reset = useCallback(() => {
    abort();
    setContent("");
    setError(null);
  }, [abort]);

  return {
    isStreaming,
    content,
    error,
    streamResponse,
    reset,
    abort,
    setContent,
  };
}

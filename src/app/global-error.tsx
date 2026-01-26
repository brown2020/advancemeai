"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary that catches errors in the root layout
 * This is a last resort error handler
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Use console.error here as logger may not be available
    console.error("Critical application error:", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <div style={{ maxWidth: "28rem", textAlign: "center" }}>
            <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem", fontWeight: "bold" }}>
              Critical Error
            </h2>
            <p style={{ marginBottom: "1.5rem" }}>
              A critical error occurred. Please refresh the page or contact support.
            </p>
            {error.digest && (
              <p style={{ marginBottom: "1.5rem", fontSize: "0.875rem" }}>
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#000",
                color: "#fff",
                borderRadius: "0.375rem",
                border: "none",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

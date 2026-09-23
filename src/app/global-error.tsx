"use client";

import { useEffect } from "react";
import { logger } from "@/utils/logger";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/*
 * Last-resort boundary for errors in the root layout. It replaces the whole
 * document, so it can't rely on the app shell, fonts, or globals.css. Styles
 * are inlined here and mirror the brand tokens (light + dark).
 */
const STYLES = `
  :root {
    --bg: #f6f7fb; --fg: #14162b; --muted: #5b6078; --card: #ffffff;
    --border: #e3e5ee; --primary: #4f46e5; --primary-fg: #ffffff;
    --danger-bg: rgb(220 38 38 / 0.1); --danger: #dc2626;
    color-scheme: light dark;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0b0c14; --fg: #e8e9f3; --muted: #9aa0bb; --card: #141626;
      --border: #262a40; --primary: #818cf8; --primary-fg: #0b0c14;
      --danger-bg: rgb(248 113 113 / 0.12); --danger: #f87171;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100svh; display: flex; align-items: center;
    justify-content: center; padding: 1.5rem; background: var(--bg);
    color: var(--fg);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .ge-card {
    width: 100%; max-width: 28rem; text-align: center; background: var(--card);
    border: 1px solid var(--border); border-radius: 1.5rem; padding: 2.5rem 1.5rem;
    box-shadow: 0 4px 12px -2px rgb(16 18 40 / 0.08), 0 12px 32px -8px rgb(16 18 40 / 0.12);
  }
  .ge-brand { font-weight: 700; letter-spacing: -0.015em; color: var(--primary); margin: 0 0 1.5rem; }
  .ge-icon {
    width: 4rem; height: 4rem; margin: 0 auto 1.25rem; border-radius: 1.25rem;
    display: flex; align-items: center; justify-content: center;
    background: var(--danger-bg); color: var(--danger);
  }
  h1 { font-size: 1.5rem; line-height: 1.25; margin: 0 0 0.75rem; letter-spacing: -0.015em; }
  p { margin: 0; color: var(--muted); line-height: 1.5; }
  .ge-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; margin-top: 2rem; }
  .ge-btn {
    display: inline-flex; align-items: center; justify-content: center; height: 3rem;
    padding: 0 1.5rem; border-radius: 1.25rem; font: inherit; font-weight: 600;
    font-size: 1rem; cursor: pointer; text-decoration: none; min-width: 9rem;
  }
  .ge-btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
  .ge-primary { background: var(--primary); color: var(--primary-fg); border: 0; }
  .ge-outline { background: transparent; color: var(--fg); border: 1px solid var(--border); }
  .ge-digest { margin-top: 1.5rem; font-family: ui-monospace, Menlo, monospace; font-size: 0.75rem; }
`;

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    logger.error("Critical application error:", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>Something went wrong | Advance.me</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{STYLES}</style>
      </head>
      <body>
        <main className="ge-card" role="alert">
          <p className="ge-brand">Advance.me</p>
          <div className="ge-icon" aria-hidden>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <h1>Something went wrong</h1>
          <p>
            Advance.me ran into an unexpected problem. Try again, or reload from
            the home page. Your saved progress is safe.
          </p>
          <div className="ge-actions">
            <button type="button" className="ge-btn ge-primary" onClick={reset}>
              Try again
            </button>
            {/* A full page load is intentional: the app shell itself failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="ge-btn ge-outline">
              Go home
            </a>
          </div>
          {error.digest && <p className="ge-digest">Error ID: {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}

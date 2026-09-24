/**
 * Shared OpenAI configuration for server-side AI routes.
 * Server-only: never import from client components.
 */

import OpenAI from "openai";

/** SAT question + reading passage generation. Override via OPENAI_QUESTION_MODEL. */
export const QUESTION_MODEL = process.env.OPENAI_QUESTION_MODEL || "gpt-4.1";

/** Conversational tutor and study guide generation. */
export const CHAT_MODEL = "gpt-4o-mini";

/** Short structured outputs (explanations, study plans, streamed questions). */
export const FAST_MODEL = "gpt-4.1-mini";

let openaiClient: OpenAI | null = null;

/** Lazily-initialized OpenAI SDK client */
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/** Whether an OpenAI key is configured for this deployment */
export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

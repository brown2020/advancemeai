/**
 * API route validation utilities
 * Provides consistent request validation and error responses
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "./logger";

/**
 * Result type for request validation
 */
type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: NextResponse };

/**
 * Validate a request body against a Zod schema
 *
 * @example
 * ```ts
 * const schema = z.object({ name: z.string() });
 *
 * export async function POST(request: NextRequest) {
 *   const validation = await validateRequest(request, schema);
 *   if (!validation.success) return validation.error;
 *
 *   const { name } = validation.data;
 *   // ...
 * }
 * ```
 */
export async function validateRequest<T extends z.ZodTypeAny>(
  request: NextRequest,
  schema: T
): Promise<ValidationResult<z.infer<T>>> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      logger.warn("Request validation failed:", result.error.flatten());
      return {
        success: false,
        error: NextResponse.json(
          { error: "Invalid request", details: result.error.flatten() },
          { status: 400 }
        ),
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    logger.error("Failed to parse request body:", error);
    return {
      success: false,
      error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: unknown
): NextResponse {
  const body: Record<string, unknown> = { error: message };

  if (process.env.NODE_ENV === "development" && details) {
    body.details = details;
  }

  return NextResponse.json(body, { status });
}

/**
 * Create a standardized success response
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Common Zod schemas for reuse across API routes
 */
export const CommonSchemas = {
  /** Section ID enum */
  sectionId: z.enum(["reading", "writing", "math-calc", "math-no-calc"]),

  /** Difficulty enum (string) */
  difficulty: z.enum(["easy", "medium", "hard"]),

  /** Difficulty level (numeric 1-5) */
  difficultyLevel: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),

  /** Pagination params */
  pagination: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(10),
  }),
};

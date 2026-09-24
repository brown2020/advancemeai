import { logger } from "./logger";

/**
 * Error types for consistent error handling
 */
export enum ErrorType {
  VALIDATION = "VALIDATION",
  AUTHORIZATION = "AUTHORIZATION",
  NOT_FOUND = "NOT_FOUND",
  SERVER = "SERVER",
  UNKNOWN = "UNKNOWN",
}

/**
 * Application error with type and context
 */
export class AppError extends Error {
  type: ErrorType;
  context?: Record<string, unknown>;
  originalError?: unknown;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    context?: Record<string, unknown>,
    originalError?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.context = context;
    this.originalError = originalError;
  }
}

/**
 * Log an error with context
 */
export function logError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  if (error instanceof AppError) {
    logger.error(error.message, {
      type: error.type,
      context: { ...error.context, ...context },
      originalError: error.originalError,
    });
    return;
  }

  if (error instanceof Error) {
    logger.error(error.message, {
      error,
      context,
    });
    return;
  }

  logger.error("Unknown error", {
    error,
    context,
  });
}

/**
 * Create a not found error
 */
export function createNotFoundError(resource: string, id?: string): AppError {
  const message = id
    ? `${resource} with ID ${id} not found`
    : `${resource} not found`;
  return new AppError(message, ErrorType.NOT_FOUND, { resource, id });
}

import { logger } from "./logger";

/**
 * Custom application error class
 */
export class AppError extends Error {
  /**
   * Creates a new application error
   * @param message Error message
   * @param code Error code
   * @param httpStatus HTTP status code
   */
  constructor(
    message: string,
    public readonly code: string,
    public readonly httpStatus: number = 500
  ) {
    super(message);
    this.name = "AppError";

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Error codes for the application
 */
export const ErrorCode = {
  AUTHENTICATION: "auth_error",
  AUTHORIZATION: "authorization_error",
  NOT_FOUND: "not_found",
  VALIDATION: "validation_error",
  SERVER_ERROR: "server_error",
  CONFLICT: "conflict_error",
  RATE_LIMIT: "rate_limit_error",
  TIMEOUT: "timeout_error",
  NETWORK: "network_error",
  UNKNOWN: "unknown_error",
};

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Handles an unknown error and converts it to an AppError
 */
export function handleError(error: unknown): AppError {
  logger.error("Error caught:", error);

  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, ErrorCode.UNKNOWN, 500);
  }

  return new AppError("An unknown error occurred", ErrorCode.UNKNOWN, 500);
}

/**
 * Creates a validation error
 */
export function createValidationError(message: string): AppError {
  return new AppError(message, ErrorCode.VALIDATION, 400);
}

/**
 * Creates a not found error
 */
export function createNotFoundError(resource: string): AppError {
  return new AppError(`${resource} not found`, ErrorCode.NOT_FOUND, 404);
}

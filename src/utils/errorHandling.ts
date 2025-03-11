export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public httpStatus: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function handleApiError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, "unknown_error");
  }

  return new AppError("An unknown error occurred", "unknown_error");
}

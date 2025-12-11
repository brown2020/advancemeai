/**
 * Application logger with different log levels
 * Simplified functional implementation
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Set the minimum log level based on environment
const MIN_LOG_LEVEL =
  process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG;

/**
 * Format a log message with timestamp and level
 */
function formatMessage(level: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
}

type ConsoleMethod = "debug" | "info" | "warn" | "error";

/**
 * Creates a log method for a specific level
 */
const createLogMethod =
  (level: LogLevel, method: ConsoleMethod) =>
  (message: string, ...args: unknown[]): void => {
    if (MIN_LOG_LEVEL <= level) {
      console[method](formatMessage(LogLevel[level], message), ...args);
    }
  };

/**
 * Logger with methods for different log levels
 */
export const logger = {
  debug: createLogMethod(LogLevel.DEBUG, "debug"),
  info: createLogMethod(LogLevel.INFO, "info"),
  warn: createLogMethod(LogLevel.WARN, "warn"),
  error: createLogMethod(LogLevel.ERROR, "error"),
};

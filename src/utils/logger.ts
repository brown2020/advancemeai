/**
 * Application logger with different log levels
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

/**
 * Logger class with methods for different log levels
 */
class Logger {
  debug(message: string, ...args: unknown[]): void {
    if (MIN_LOG_LEVEL <= LogLevel.DEBUG) {
      console.debug(formatMessage("DEBUG", message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (MIN_LOG_LEVEL <= LogLevel.INFO) {
      console.info(formatMessage("INFO", message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (MIN_LOG_LEVEL <= LogLevel.WARN) {
      console.warn(formatMessage("WARN", message), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (MIN_LOG_LEVEL <= LogLevel.ERROR) {
      console.error(formatMessage("ERROR", message), ...args);
    }
  }
}

// Export a singleton instance
export const logger = new Logger();

/**
 * Centralized logger utility for the editor application.
 * Logs to console in development mode. Can be extended to send to
 * an error reporting service in production.
 */

const IS_DEV = process.env.NODE_ENV === "development";

/**
 * Logs an informational message.
 * @param {string} context - The source context (e.g., component or function name)
 * @param {string} message - The log message
 * @param {...*} args - Additional data to log
 */
function info(context, message, ...args) {
  try {
    if (IS_DEV) {
      console.info(`[${context}]`, message, ...args);
    }
  } catch (error) {
    // Logging should never throw
  }
}

/**
 * Logs a warning message.
 * @param {string} context - The source context
 * @param {string} message - The warning message
 * @param {...*} args - Additional data to log
 */
function warn(context, message, ...args) {
  try {
    if (IS_DEV) {
      console.warn(`[${context}]`, message, ...args);
    }
  } catch (error) {
    // Logging should never throw
  }
}

/**
 * Logs an error message.
 * @param {string} context - The source context
 * @param {string} message - The error message
 * @param {Error} [error] - The error object
 * @param {...*} args - Additional data to log
 */
function logError(context, message, error, ...args) {
  try {
    console.error(`[${context}]`, message, error, ...args);
  } catch (logErr) {
    // Logging should never throw
  }
}

const logger = { info, warn, error: logError };

export default logger;

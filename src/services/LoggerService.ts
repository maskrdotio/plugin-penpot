/**
 * Logger Service - Structured Logging
 *
 * Provides consistent, structured logging throughout the application.
 * In production, logs could be sent to an external service.
 */

import { config } from '@/config'

// =============================================================================
// Types
// =============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  event: string
  message?: string
  timestamp: number
  data?: Record<string, unknown>
}

export interface Logger {
  debug: (event: string, data?: Record<string, unknown>) => void
  info: (event: string, data?: Record<string, unknown>) => void
  warn: (event: string, data?: Record<string, unknown>) => void
  error: (event: string, error: Error, data?: Record<string, unknown>) => void
}

// =============================================================================
// Log Level Configuration
// =============================================================================

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// Minimum log level based on environment
const MIN_LOG_LEVEL: LogLevel = config.isDev ? 'debug' : 'info'

// =============================================================================
// Logger Implementation
// =============================================================================

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL]
}

function formatEntry(entry: LogEntry): string {
  return JSON.stringify(entry)
}

function createEntry(
  level: LogLevel,
  event: string,
  data?: Record<string, unknown>,
  error?: Error
): LogEntry {
  const entry: LogEntry = {
    level,
    event,
    timestamp: Date.now(),
  }

  if (data && Object.keys(data).length > 0) {
    entry.data = data
  }

  if (error) {
    entry.message = error.message
    entry.data = {
      ...entry.data,
      stack: error.stack,
      name: error.name,
    }
  }

  return entry
}

/**
 * Log to console with appropriate method
 */
function logToConsole(entry: LogEntry, error?: Error): void {
  const formatted = formatEntry(entry)

  switch (entry.level) {
    case 'debug':
      console.debug(formatted)
      break
    case 'info':
      console.info(formatted)
      break
    case 'warn':
      console.warn(formatted)
      break
    case 'error':
      console.error(formatted, error)
      break
  }
}

/**
 * In production, this could send logs to an external service
 */
function sendToService(_entry: LogEntry): void {
  // Future: Send to logging service
  // await fetch('/api/logs', { method: 'POST', body: JSON.stringify(entry) })
}

// =============================================================================
// Logger Factory
// =============================================================================

export function createLogger(namespace?: string): Logger {
  const prefix = namespace ? `[${namespace}]` : ''

  function log(
    level: LogLevel,
    event: string,
    data?: Record<string, unknown>,
    error?: Error
  ): void {
    if (!shouldLog(level)) return

    const fullEvent = prefix ? `${prefix} ${event}` : event
    const entry = createEntry(level, fullEvent, data, error)

    // Always log to console
    logToConsole(entry, error)

    // In production, also send to service
    if (!config.isDev && level === 'error') {
      sendToService(entry)
    }
  }

  return {
    debug(event, data) {
      log('debug', event, data)
    },
    info(event, data) {
      log('info', event, data)
    },
    warn(event, data) {
      log('warn', event, data)
    },
    error(event, error, data) {
      log('error', event, data, error)
    },
  }
}

// =============================================================================
// Default Logger Instance
// =============================================================================

export const logger = createLogger()

// =============================================================================
// Specialized Loggers
// =============================================================================

export const apiLogger = createLogger('API')
export const authLogger = createLogger('Auth')
export const processingLogger = createLogger('Processing')
export const penpotLogger = createLogger('Penpot')

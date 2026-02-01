/**
 * Retry Utility - Exponential Backoff for API Calls
 *
 * Provides resilient network operations with configurable retry strategies.
 */

// =============================================================================
// Types
// =============================================================================

export interface RetryOptions {
  /** Maximum number of attempts (default: 3) */
  maxAttempts?: number
  /** Base delay in milliseconds (default: 1000) */
  baseDelay?: number
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelay?: number
  /** Multiplier for exponential backoff (default: 2) */
  multiplier?: number
  /** Add jitter to prevent thundering herd (default: true) */
  jitter?: boolean
  /** Custom function to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean
  /** Callback invoked before each retry */
  onRetry?: (attempt: number, error: unknown, delay: number) => void
  /** AbortSignal for cancellation */
  signal?: AbortSignal
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: unknown
  attempts: number
}

// =============================================================================
// Default Retry Predicate
// =============================================================================

/**
 * Default function to determine if an error is retryable
 * Retries on network errors and 5xx server errors
 */
export function isRetryableError(error: unknown): boolean {
  // Don't retry on abort
  if (error instanceof DOMException && error.name === 'AbortError') {
    return false
  }

  // Network errors are retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }

  // Check for HTTP status in error
  if (error instanceof Error) {
    // Check for common error patterns
    const message = error.message.toLowerCase()

    // Network errors
    if (message.includes('network') || message.includes('connection')) {
      return true
    }

    // Don't retry auth errors
    if (message.includes('401') || message.includes('unauthorized')) {
      return false
    }

    // Don't retry client errors
    if (message.includes('400') || message.includes('403') || message.includes('404')) {
      return false
    }

    // Retry server errors (5xx)
    if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
      return true
    }

    // Retry timeout errors
    if (message.includes('timeout')) {
      return true
    }
  }

  // Don't retry unknown errors by default
  return false
}

// =============================================================================
// Retry Implementation
// =============================================================================

/**
 * Calculate delay with optional jitter
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  multiplier: number,
  jitter: boolean
): number {
  // Exponential backoff
  let delay = baseDelay * Math.pow(multiplier, attempt - 1)

  // Cap at max delay
  delay = Math.min(delay, maxDelay)

  // Add jitter (±25%)
  if (jitter) {
    const jitterFactor = 0.75 + Math.random() * 0.5
    delay = Math.round(delay * jitterFactor)
  }

  return delay
}

/**
 * Sleep for a specified duration, respecting abort signal
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const timeoutId = setTimeout(resolve, ms)

    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId)
      reject(new DOMException('Aborted', 'AbortError'))
    }, { once: true })
  })
}

/**
 * Execute a function with retry and exponential backoff
 *
 * @example
 * ```ts
 * const result = await withRetry(
 *   () => api.removeBackground(imageData, filename),
 *   {
 *     maxAttempts: 3,
 *     baseDelay: 1000,
 *     onRetry: (attempt, error, delay) => {
 *       console.log(`Retry ${attempt} after ${delay}ms:`, error)
 *     }
 *   }
 * )
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    multiplier = 2,
    jitter = true,
    isRetryable = isRetryableError,
    onRetry,
    signal,
  } = options

  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Check for abort before attempt
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }

    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry if we've exhausted attempts
      if (attempt >= maxAttempts) {
        throw error
      }

      // Don't retry if error isn't retryable
      if (!isRetryable(error)) {
        throw error
      }

      // Calculate delay
      const delay = calculateDelay(attempt, baseDelay, maxDelay, multiplier, jitter)

      // Notify callback
      onRetry?.(attempt, error, delay)

      // Wait before next attempt
      await sleep(delay, signal)
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError
}

/**
 * Execute with retry, returning a result object instead of throwing
 *
 * @example
 * ```ts
 * const result = await tryWithRetry(() => api.call())
 * if (result.success) {
 *   console.log('Data:', result.data)
 * } else {
 *   console.log('Failed after', result.attempts, 'attempts')
 * }
 * ```
 */
export async function tryWithRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const maxAttempts = options.maxAttempts ?? 3
  let attempts = 0

  try {
    const data = await withRetry(fn, {
      ...options,
      onRetry: (attempt, error, delay) => {
        attempts = attempt
        options.onRetry?.(attempt, error, delay)
      },
    })

    return {
      success: true,
      data,
      attempts: attempts + 1,
    }
  } catch (error) {
    return {
      success: false,
      error,
      attempts: Math.min(attempts + 1, maxAttempts),
    }
  }
}

/**
 * Create a retryable version of an async function
 *
 * @example
 * ```ts
 * const fetchWithRetry = retryable(fetch, { maxAttempts: 3 })
 * const response = await fetchWithRetry('https://api.example.com')
 * ```
 */
export function retryable<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => withRetry(() => fn(...args), options)
}

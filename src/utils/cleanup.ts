/**
 * Resource cleanup and timeout utilities
 *
 * Provides patterns for safe async operations with proper cleanup,
 * timeout management, and resource tracking.
 */

// =============================================================================
// Timeout Utilities
// =============================================================================

/**
 * Wrap a promise with a timeout
 *
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param onTimeout - Optional callback when timeout occurs (for cleanup)
 * @returns Promise that rejects on timeout
 *
 * @example
 * ```ts
 * const result = await withTimeout(
 *   fetchData(),
 *   5000,
 *   () => console.log('Fetch timed out')
 * )
 * ```
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  onTimeout?: () => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      onTimeout?.()
      reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    promise
      .then((result) => {
        clearTimeout(timeoutId)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timeoutId)
        reject(error)
      })
  })
}

/**
 * Create an AbortController that auto-aborts after a timeout
 *
 * @param timeoutMs - Timeout in milliseconds
 * @returns Object with controller and cleanup function
 *
 * @example
 * ```ts
 * const { controller, cleanup } = createTimeoutController(5000)
 * try {
 *   await fetch(url, { signal: controller.signal })
 * } finally {
 *   cleanup()
 * }
 * ```
 */
export function createTimeoutController(timeoutMs: number): {
  controller: AbortController
  cleanup: () => void
} {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  return {
    controller,
    cleanup: () => clearTimeout(timeoutId),
  }
}

// =============================================================================
// Cleanup Registry
// =============================================================================

/**
 * Create a cleanup registry for managing multiple cleanup functions
 *
 * Useful for tracking resources that need cleanup when an operation
 * completes or fails.
 *
 * @example
 * ```ts
 * const registry = createCleanupRegistry()
 *
 * const url1 = URL.createObjectURL(blob1)
 * registry.register(() => URL.revokeObjectURL(url1))
 *
 * const url2 = URL.createObjectURL(blob2)
 * registry.register(() => URL.revokeObjectURL(url2))
 *
 * // Later, clean up all resources
 * registry.cleanup()
 * ```
 */
export function createCleanupRegistry(): {
  register: (fn: () => void) => void
  cleanup: () => void
  size: () => number
} {
  const cleanupFns: Array<() => void> = []

  return {
    /** Register a cleanup function */
    register(fn: () => void) {
      cleanupFns.push(fn)
    },

    /** Execute all cleanup functions and clear the registry */
    cleanup() {
      // Execute in reverse order (LIFO)
      while (cleanupFns.length > 0) {
        const fn = cleanupFns.pop()
        try {
          fn?.()
        } catch (error) {
          // Log but don't throw - we want all cleanup to run
          console.error('Cleanup function failed:', error)
        }
      }
    },

    /** Get the number of registered cleanup functions */
    size() {
      return cleanupFns.length
    },
  }
}

// =============================================================================
// Event Listener Helpers
// =============================================================================

/**
 * Add an event listener with automatic cleanup
 *
 * @param target - The event target
 * @param type - Event type
 * @param handler - Event handler
 * @param options - Event listener options
 * @returns Cleanup function to remove the listener
 */
export function addEventListenerWithCleanup<K extends keyof WindowEventMap>(
  target: Window,
  type: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions
): () => void {
  target.addEventListener(type, handler, options)
  return () => target.removeEventListener(type, handler, options)
}

/**
 * Create a one-time event listener that auto-removes after firing
 * with optional timeout
 *
 * @param target - The event target
 * @param type - Event type
 * @param timeoutMs - Optional timeout in milliseconds
 * @returns Promise that resolves with the event
 */
export function waitForEvent<K extends keyof WindowEventMap>(
  target: Window,
  type: K,
  timeoutMs?: number
): Promise<WindowEventMap[K]> {
  return new Promise((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const handler = (event: WindowEventMap[K]) => {
      if (timeoutId) clearTimeout(timeoutId)
      target.removeEventListener(type, handler)
      resolve(event)
    }

    target.addEventListener(type, handler)

    if (timeoutMs) {
      timeoutId = setTimeout(() => {
        target.removeEventListener(type, handler)
        reject(new TimeoutError(`Waiting for ${type} event timed out after ${timeoutMs}ms`))
      }, timeoutMs)
    }
  })
}

// =============================================================================
// Error Types
// =============================================================================

/** Error thrown when an operation times out */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TimeoutError'
    Object.setPrototypeOf(this, TimeoutError.prototype)
  }
}

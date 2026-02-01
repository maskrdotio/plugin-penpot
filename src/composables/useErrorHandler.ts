/**
 * Error Handler Composable
 *
 * Provides centralized error state management with automatic
 * user message extraction and error clearing.
 */

import { ref, readonly, type Ref, type DeepReadonly } from 'vue'
import {
  isCancellationError,
  isAuthError,
  isCreditsError,
  type ErrorCodeType,
  ErrorCode,
  mapErrorToDetails,
} from '@/utils/errors'

// =============================================================================
// Types
// =============================================================================

export interface ErrorState {
  /** User-friendly error message */
  message: string | null
  /** Error code for programmatic handling */
  code: ErrorCodeType | null
  /** Whether the error is recoverable */
  recoverable: boolean
}

export interface ErrorHandler {
  /** Current error state (readonly) */
  error: DeepReadonly<Ref<ErrorState>>
  /** Whether there is an active error */
  hasError: Ref<boolean>
  /**
   * Handle an error, updating state and optionally calling lifecycle callbacks
   * @param error - The error to handle
   * @param callbacks - Optional lifecycle callbacks
   */
  handleError: (
    error: unknown,
    callbacks?: {
      onAuthError?: () => void
      onCreditsError?: () => void
    }
  ) => void
  /** Clear the current error */
  clearError: () => void
  /** Set a custom error message */
  setError: (message: string, code?: ErrorCodeType) => void
}

// =============================================================================
// Composable
// =============================================================================

/**
 * Create an error handler instance
 *
 * @param options - Configuration options
 * @returns Error handler with state and methods
 *
 * @example
 * ```ts
 * const { error, handleError, clearError } = useErrorHandler({
 *   autoClearMs: 5000
 * })
 *
 * try {
 *   await api.doSomething()
 * } catch (err) {
 *   handleError(err, {
 *     onAuthError: () => router.push('/login')
 *   })
 * }
 * ```
 */
export function useErrorHandler(options: {
  /** Auto-clear recoverable errors after this many milliseconds */
  autoClearMs?: number
} = {}): ErrorHandler {
  const { autoClearMs } = options

  const errorState = ref<ErrorState>({
    message: null,
    code: null,
    recoverable: true,
  })

  const hasError = ref(false)
  let autoClearTimeout: ReturnType<typeof setTimeout> | null = null

  function clearAutoClearTimeout() {
    if (autoClearTimeout) {
      clearTimeout(autoClearTimeout)
      autoClearTimeout = null
    }
  }

  function clearError() {
    clearAutoClearTimeout()
    errorState.value = {
      message: null,
      code: null,
      recoverable: true,
    }
    hasError.value = false
  }

  function setError(message: string, code: ErrorCodeType = ErrorCode.UNKNOWN) {
    clearAutoClearTimeout()
    errorState.value = {
      message,
      code,
      recoverable: true,
    }
    hasError.value = true

    // Auto-clear if configured
    if (autoClearMs && errorState.value.recoverable) {
      autoClearTimeout = setTimeout(clearError, autoClearMs)
    }
  }

  function handleError(
    error: unknown,
    callbacks?: {
      onAuthError?: () => void
      onCreditsError?: () => void
    }
  ) {
    // Ignore cancellation errors
    if (isCancellationError(error)) {
      return
    }

    clearAutoClearTimeout()

    // Extract error details
    const details = mapErrorToDetails(error)

    errorState.value = {
      message: details.userMessage,
      code: details.code,
      recoverable: details.recoverable,
    }
    hasError.value = true

    // Call lifecycle callbacks
    if (isAuthError(error)) {
      callbacks?.onAuthError?.()
    }

    if (isCreditsError(error)) {
      callbacks?.onCreditsError?.()
    }

    // Auto-clear recoverable errors
    if (autoClearMs && details.recoverable) {
      autoClearTimeout = setTimeout(clearError, autoClearMs)
    }
  }

  return {
    error: readonly(errorState),
    hasError: readonly(hasError) as Ref<boolean>,
    handleError,
    clearError,
    setError,
  }
}

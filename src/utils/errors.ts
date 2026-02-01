/**
 * Centralized error handling utilities
 *
 * Provides consistent error types, error code mappings, and
 * user-friendly error message generation.
 */

import { ApiError } from '@/services/ApiService'
import { ImageProcessingError } from '@/services/ImageProcessingService'
import { TimeoutError } from './cleanup'

// =============================================================================
// Error Codes
// =============================================================================

/** Application-wide error codes */
export const ErrorCode = {
  // Authentication errors
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Billing errors
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',

  // Processing errors
  PROCESSING_FAILED: 'PROCESSING_FAILED',
  EXPORT_FAILED: 'EXPORT_FAILED',

  // User actions
  CANCELLED: 'CANCELLED',

  // Unknown
  UNKNOWN: 'UNKNOWN',
} as const

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode]

// =============================================================================
// Application Error
// =============================================================================

/**
 * Base application error with additional context
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCodeType,
    public readonly userMessage: string,
    public readonly recoverable: boolean = true,
    public readonly originalError?: unknown
  ) {
    super(message)
    this.name = 'AppError'
    Object.setPrototypeOf(this, AppError.prototype)
  }

  /** Create from an unknown error */
  static from(error: unknown): AppError {
    if (error instanceof AppError) {
      return error
    }

    const { code, userMessage, recoverable } = mapErrorToDetails(error)

    return new AppError(
      error instanceof Error ? error.message : String(error),
      code,
      userMessage,
      recoverable,
      error
    )
  }
}

// =============================================================================
// Error Mapping
// =============================================================================

interface ErrorDetails {
  code: ErrorCodeType
  userMessage: string
  recoverable: boolean
}

/**
 * Map any error to standardized details
 */
export function mapErrorToDetails(error: unknown): ErrorDetails {
  // Handle cancellation
  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      code: ErrorCode.CANCELLED,
      userMessage: 'Operation was cancelled',
      recoverable: true,
    }
  }

  // Handle API errors
  if (error instanceof ApiError) {
    if (error.isAuthError) {
      return {
        code: ErrorCode.SESSION_EXPIRED,
        userMessage: 'Your session has expired. Please sign in again.',
        recoverable: true,
      }
    }

    if (error.isCreditsError) {
      return {
        code: ErrorCode.INSUFFICIENT_CREDITS,
        userMessage: 'Insufficient credits. Please upgrade your plan.',
        recoverable: true,
      }
    }

    if (error.isNetworkError) {
      return {
        code: ErrorCode.NETWORK_ERROR,
        userMessage: 'Network error. Please check your connection and try again.',
        recoverable: true,
      }
    }

    return {
      code: ErrorCode.PROCESSING_FAILED,
      userMessage: error.message,
      recoverable: true,
    }
  }

  // Handle timeout errors
  if (error instanceof TimeoutError) {
    return {
      code: ErrorCode.TIMEOUT,
      userMessage: 'The operation timed out. Please try again.',
      recoverable: true,
    }
  }

  // Handle image processing errors
  if (error instanceof ImageProcessingError) {
    return {
      code: ErrorCode.PROCESSING_FAILED,
      userMessage: 'Failed to process image. Please try again.',
      recoverable: true,
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    // Check for known error patterns
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return {
        code: ErrorCode.NETWORK_ERROR,
        userMessage: 'Network error. Please check your connection and try again.',
        recoverable: true,
      }
    }

    return {
      code: ErrorCode.UNKNOWN,
      userMessage: error.message,
      recoverable: true,
    }
  }

  // Unknown error type
  return {
    code: ErrorCode.UNKNOWN,
    userMessage: 'An unexpected error occurred. Please try again.',
    recoverable: true,
  }
}

/**
 * Get user-friendly error message from any error
 */
export function getUserMessage(error: unknown): string {
  return mapErrorToDetails(error).userMessage
}

/**
 * Check if an error is recoverable (user can retry)
 */
export function isRecoverableError(error: unknown): boolean {
  return mapErrorToDetails(error).recoverable
}

/**
 * Check if an error is due to cancellation
 */
export function isCancellationError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true
  }
  if (error instanceof AppError && error.code === ErrorCode.CANCELLED) {
    return true
  }
  return false
}

/**
 * Check if an error requires re-authentication
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof ApiError && error.isAuthError) {
    return true
  }
  if (error instanceof AppError && error.code === ErrorCode.SESSION_EXPIRED) {
    return true
  }
  return false
}

/**
 * Check if an error is due to insufficient credits
 */
export function isCreditsError(error: unknown): boolean {
  if (error instanceof ApiError && error.isCreditsError) {
    return true
  }
  if (error instanceof AppError && error.code === ErrorCode.INSUFFICIENT_CREDITS) {
    return true
  }
  return false
}

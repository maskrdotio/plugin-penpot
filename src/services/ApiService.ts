/**
 * API Service - Handles all communication with the maskr.io API
 *
 * Features:
 * - Request timeout via AbortController
 * - Request cancellation support
 * - Type-safe error handling
 * - Automatic token injection
 */

import { config } from '@/config'
import type { RemoveBgResponse, BatchResponse } from '@/types'

// =============================================================================
// Error Types
// =============================================================================

/** Custom error class for API-related errors */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message)
    this.name = 'ApiError'
    // Restore prototype chain for instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype)
  }

  /** Check if error is due to authentication issues */
  get isAuthError(): boolean {
    return this.status === 401
  }

  /** Check if error is due to insufficient credits */
  get isCreditsError(): boolean {
    return this.status === 402
  }

  /** Check if error is a network error */
  get isNetworkError(): boolean {
    return this.status === 0
  }
}

// =============================================================================
// Service Interface
// =============================================================================

export interface ApiService {
  /**
   * Remove background from a single image
   * @param imageData - The image data as Uint8Array
   * @param filename - The filename for the upload
   * @param signal - Optional AbortSignal for cancellation
   */
  removeBackground(
    imageData: Uint8Array,
    filename: string,
    signal?: AbortSignal
  ): Promise<RemoveBgResponse>

  /**
   * Remove background from multiple images
   * @param images - Array of image data and filenames
   * @param signal - Optional AbortSignal for cancellation
   */
  removeBackgroundBatch(
    images: Array<{ data: Uint8Array; filename: string }>,
    signal?: AbortSignal
  ): Promise<BatchResponse>

  /**
   * Download a mask image from URL
   * @param url - The URL of the mask image
   * @param signal - Optional AbortSignal for cancellation
   */
  downloadMask(url: string, signal?: AbortSignal): Promise<Uint8Array>
}

// =============================================================================
// Service Factory
// =============================================================================

/**
 * Create an API service instance
 *
 * @param getToken - Function to retrieve the current auth token
 * @returns ApiService instance
 */
export function createApiService(getToken: () => string | null): ApiService {
  /**
   * Make an authenticated API request with timeout
   */
  async function request<T>(
    endpoint: string,
    options: RequestInit = {},
    signal?: AbortSignal
  ): Promise<T> {
    const token = getToken()
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'UNAUTHENTICATED')
    }

    // Create timeout controller
    const timeoutController = new AbortController()
    const timeoutId = setTimeout(
      () => timeoutController.abort(),
      config.api.timeout
    )

    // Combine signals if external signal provided
    const combinedSignal = signal
      ? combineAbortSignals(signal, timeoutController.signal)
      : timeoutController.signal

    try {
      const response = await fetch(`${config.api.baseUrl}${endpoint}`, {
        ...options,
        signal: combinedSignal,
        headers: {
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw createApiError(response.status, response.statusText)
      }

      return response.json()
    } catch (error) {
      clearTimeout(timeoutId)

      // Re-throw ApiErrors as-is
      if (error instanceof ApiError) {
        throw error
      }

      // Handle abort errors
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error
      }

      // Handle network errors
      throw new ApiError(
        'Network error. Please check your connection.',
        0,
        'NETWORK_ERROR'
      )
    }
  }

  return {
    async removeBackground(imageData, filename, signal) {
      const formData = new FormData()
      // Type assertion needed due to TS strict mode with ArrayBufferLike
      const blob = new Blob([imageData as BlobPart], { type: 'image/png' })
      formData.append('file', blob, filename)

      return request<RemoveBgResponse>(
        '/v1/remove-bg?output=mask',
        {
          method: 'POST',
          body: formData,
        },
        signal
      )
    },

    async removeBackgroundBatch(images, signal) {
      const formData = new FormData()

      for (const { data, filename } of images) {
        // Type assertion needed due to TS strict mode with ArrayBufferLike
        const blob = new Blob([data as BlobPart], { type: 'image/png' })
        formData.append('files', blob, filename)
      }

      return request<BatchResponse>(
        '/v1/remove-bg/batch?output=mask',
        {
          method: 'POST',
          body: formData,
        },
        signal
      )
    },

    async downloadMask(url, signal) {
      // Mask download doesn't require auth token
      const timeoutController = new AbortController()
      const timeoutId = setTimeout(
        () => timeoutController.abort(),
        config.api.timeout
      )

      const combinedSignal = signal
        ? combineAbortSignals(signal, timeoutController.signal)
        : timeoutController.signal

      try {
        const response = await fetch(url, { signal: combinedSignal })
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new ApiError(
            'Failed to download mask',
            response.status,
            'DOWNLOAD_ERROR'
          )
        }

        const buffer = await response.arrayBuffer()
        return new Uint8Array(buffer)
      } catch (error) {
        clearTimeout(timeoutId)

        if (error instanceof ApiError) throw error
        if (error instanceof DOMException && error.name === 'AbortError') throw error

        throw new ApiError('Failed to download mask', 0, 'NETWORK_ERROR')
      }
    },
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create appropriate ApiError based on status code
 */
function createApiError(status: number, statusText: string): ApiError {
  switch (status) {
    case 401:
      return new ApiError('Session expired. Please sign in again.', 401, 'SESSION_EXPIRED')
    case 402:
      return new ApiError('Insufficient credits. Please upgrade your plan.', 402, 'INSUFFICIENT_CREDITS')
    case 429:
      return new ApiError('Too many requests. Please try again later.', 429, 'RATE_LIMITED')
    default:
      return new ApiError(`Request failed: ${statusText}`, status, 'REQUEST_FAILED')
  }
}

/**
 * Combine multiple AbortSignals into one
 * Aborts when any of the signals abort
 */
function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController()

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort()
      return controller.signal
    }

    signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  return controller.signal
}

/**
 * useErrorHandler Composable Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { withSetup } from '@/test/utils'
import { useErrorHandler } from '../useErrorHandler'
import { ApiError } from '@/services/ApiService'

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  describe('initial state', () => {
    it('starts with no error', () => {
      const [handler, app] = withSetup(() => useErrorHandler())

      expect(handler.hasError.value).toBe(false)
      expect(handler.error.value.message).toBeNull()
      expect(handler.error.value.code).toBeNull()

      app.unmount()
    })
  })

  describe('handleError', () => {
    it('sets error state from Error object', () => {
      const [handler, app] = withSetup(() => useErrorHandler())

      handler.handleError(new Error('Something went wrong'))

      expect(handler.hasError.value).toBe(true)
      expect(handler.error.value.message).toBeTruthy()

      app.unmount()
    })

    it('ignores AbortError (cancellation)', () => {
      const [handler, app] = withSetup(() => useErrorHandler())

      handler.handleError(new DOMException('Aborted', 'AbortError'))

      expect(handler.hasError.value).toBe(false)

      app.unmount()
    })

    it('calls onAuthError callback for 401 errors', () => {
      const [handler, app] = withSetup(() => useErrorHandler())
      const onAuthError = vi.fn()

      handler.handleError(
        new ApiError('Unauthorized', 401, 'AUTH_ERROR'),
        { onAuthError }
      )

      expect(onAuthError).toHaveBeenCalled()

      app.unmount()
    })

    it('calls onCreditsError callback for 402 errors', () => {
      const [handler, app] = withSetup(() => useErrorHandler())
      const onCreditsError = vi.fn()

      handler.handleError(
        new ApiError('No credits', 402, 'CREDITS_ERROR'),
        { onCreditsError }
      )

      expect(onCreditsError).toHaveBeenCalled()

      app.unmount()
    })
  })

  describe('clearError', () => {
    it('clears error state', () => {
      const [handler, app] = withSetup(() => useErrorHandler())

      handler.handleError(new Error('Test error'))
      expect(handler.hasError.value).toBe(true)

      handler.clearError()
      expect(handler.hasError.value).toBe(false)
      expect(handler.error.value.message).toBeNull()

      app.unmount()
    })
  })

  describe('setError', () => {
    it('sets custom error message', () => {
      const [handler, app] = withSetup(() => useErrorHandler())

      handler.setError('Custom error message', 'PROCESSING_FAILED')

      expect(handler.hasError.value).toBe(true)
      expect(handler.error.value.message).toBe('Custom error message')
      expect(handler.error.value.code).toBe('PROCESSING_FAILED')

      app.unmount()
    })
  })

  describe('autoClearMs option', () => {
    it('auto-clears recoverable errors after timeout', () => {
      const [handler, app] = withSetup(() =>
        useErrorHandler({ autoClearMs: 5000 })
      )

      handler.setError('Temporary error')
      expect(handler.hasError.value).toBe(true)

      vi.advanceTimersByTime(5000)
      expect(handler.hasError.value).toBe(false)

      app.unmount()
    })

    it('cancels auto-clear when error is cleared manually', () => {
      const [handler, app] = withSetup(() =>
        useErrorHandler({ autoClearMs: 5000 })
      )

      handler.setError('Temporary error')
      handler.clearError()

      // Should not throw even after timeout
      vi.advanceTimersByTime(5000)
      expect(handler.hasError.value).toBe(false)

      app.unmount()
    })
  })
})

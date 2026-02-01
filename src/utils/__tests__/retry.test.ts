/**
 * Retry Utility Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { withRetry, tryWithRetry, retryable, isRetryableError } from '../retry'

describe('retry utilities', () => {
  describe('isRetryableError', () => {
    it('returns false for AbortError', () => {
      const error = new DOMException('Aborted', 'AbortError')
      expect(isRetryableError(error)).toBe(false)
    })

    it('returns true for network errors', () => {
      const error = new Error('Network connection failed')
      expect(isRetryableError(error)).toBe(true)
    })

    it('returns true for 500 errors', () => {
      const error = new Error('Server returned 500')
      expect(isRetryableError(error)).toBe(true)
    })

    it('returns false for 401 errors', () => {
      const error = new Error('401 Unauthorized')
      expect(isRetryableError(error)).toBe(false)
    })

    it('returns false for 404 errors', () => {
      const error = new Error('404 Not Found')
      expect(isRetryableError(error)).toBe(false)
    })

    it('returns true for timeout errors', () => {
      const error = new Error('Request timeout')
      expect(isRetryableError(error)).toBe(true)
    })
  })

  describe('withRetry', () => {
    it('returns result on first success', async () => {
      const fn = vi.fn().mockResolvedValue('success')

      const result = await withRetry(fn)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('retries on retryable error and succeeds', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success')

      // Use very short delays for testing
      const result = await withRetry(fn, {
        baseDelay: 1,
        maxDelay: 10,
        jitter: false
      })

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('throws after max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(
        withRetry(fn, { maxAttempts: 2, baseDelay: 1, jitter: false })
      ).rejects.toThrow('Network error')

      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('does not retry non-retryable errors', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('401 Unauthorized'))

      await expect(withRetry(fn)).rejects.toThrow('401 Unauthorized')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('calls onRetry callback on retry', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success')
      const onRetry = vi.fn()

      await withRetry(fn, { baseDelay: 1, jitter: false, onRetry })

      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error), expect.any(Number))
    })

    it('respects abort signal', async () => {
      const controller = new AbortController()
      controller.abort()

      const fn = vi.fn().mockResolvedValue('success')

      await expect(
        withRetry(fn, { signal: controller.signal })
      ).rejects.toThrow('Aborted')

      expect(fn).not.toHaveBeenCalled()
    })

    it('uses custom isRetryable function', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Custom retryable'))
        .mockResolvedValueOnce('success')

      const result = await withRetry(fn, {
        baseDelay: 1,
        jitter: false,
        isRetryable: (err) => (err as Error).message.includes('Custom'),
      })

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('tryWithRetry', () => {
    it('returns success result', async () => {
      const fn = vi.fn().mockResolvedValue('data')

      const result = await tryWithRetry(fn)

      expect(result.success).toBe(true)
      expect(result.data).toBe('data')
      expect(result.attempts).toBe(1)
    })

    it('returns failure result after retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await tryWithRetry(fn, {
        maxAttempts: 2,
        baseDelay: 1,
        jitter: false
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.attempts).toBe(2)
    })
  })

  describe('retryable', () => {
    it('wraps function with retry logic', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success')

      const wrapped = retryable(fn, { baseDelay: 1, jitter: false })
      const result = await wrapped('arg1', 'arg2')

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })
})

/**
 * ApiService Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createApiService, ApiError } from '../ApiService'

describe('ApiService', () => {
  let mockGetToken: () => string | null

  beforeEach(() => {
    mockGetToken = vi.fn(() => 'test-token')
    vi.stubGlobal('fetch', vi.fn())
  })

  describe('createApiService', () => {
    it('creates a service instance', () => {
      const api = createApiService(mockGetToken)
      expect(api).toBeDefined()
      expect(api.removeBackground).toBeDefined()
      expect(api.removeBackgroundBatch).toBeDefined()
      expect(api.downloadMask).toBeDefined()
    })
  })

  describe('removeBackground', () => {
    it('throws ApiError when not authenticated', async () => {
      mockGetToken = vi.fn(() => null)
      const api = createApiService(mockGetToken)

      await expect(
        api.removeBackground(new Uint8Array([1, 2, 3]), 'test.png')
      ).rejects.toThrow(ApiError)

      await expect(
        api.removeBackground(new Uint8Array([1, 2, 3]), 'test.png')
      ).rejects.toThrow('Not authenticated')
    })

    it('sends request with correct headers and body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: { output_url: 'http://test.com/mask.png', credits_used: 1 } }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const api = createApiService(mockGetToken)
      const imageData = new Uint8Array([1, 2, 3])

      await api.removeBackground(imageData, 'test.png')

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain('/v1/remove-bg')
      expect(options.method).toBe('POST')
      expect(options.headers.Authorization).toBe('Bearer test-token')
      expect(options.body).toBeInstanceOf(FormData)
    })

    it('handles 401 error correctly', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })
      vi.stubGlobal('fetch', mockFetch)

      const api = createApiService(mockGetToken)

      try {
        await api.removeBackground(new Uint8Array([1, 2, 3]), 'test.png')
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).status).toBe(401)
        expect((error as ApiError).isAuthError).toBe(true)
      }
    })

    it('handles 402 error correctly', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 402,
        statusText: 'Payment Required',
      })
      vi.stubGlobal('fetch', mockFetch)

      const api = createApiService(mockGetToken)

      try {
        await api.removeBackground(new Uint8Array([1, 2, 3]), 'test.png')
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).status).toBe(402)
        expect((error as ApiError).isCreditsError).toBe(true)
      }
    })

    it('respects AbortSignal', async () => {
      const controller = new AbortController()
      const mockFetch = vi.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'))
          })
        })
      })
      vi.stubGlobal('fetch', mockFetch)

      const api = createApiService(mockGetToken)
      const promise = api.removeBackground(
        new Uint8Array([1, 2, 3]),
        'test.png',
        controller.signal
      )

      controller.abort()

      await expect(promise).rejects.toThrow('Aborted')
    })
  })

  describe('removeBackgroundBatch', () => {
    it('sends multiple files in FormData', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      })
      vi.stubGlobal('fetch', mockFetch)

      const api = createApiService(mockGetToken)
      const images = [
        { data: new Uint8Array([1, 2, 3]), filename: 'test1.png' },
        { data: new Uint8Array([4, 5, 6]), filename: 'test2.png' },
      ]

      await api.removeBackgroundBatch(images)

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toContain('/v1/remove-bg/batch')
      expect(options.body).toBeInstanceOf(FormData)
    })
  })

  describe('downloadMask', () => {
    it('downloads and returns Uint8Array', async () => {
      const mockData = new Uint8Array([1, 2, 3, 4, 5])
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockData.buffer),
      })
      vi.stubGlobal('fetch', mockFetch)

      const api = createApiService(mockGetToken)
      const result = await api.downloadMask('http://test.com/mask.png')

      expect(result).toBeInstanceOf(Uint8Array)
      expect(Array.from(result)).toEqual([1, 2, 3, 4, 5])
    })

    it('handles download errors', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })
      vi.stubGlobal('fetch', mockFetch)

      const api = createApiService(mockGetToken)

      await expect(
        api.downloadMask('http://test.com/mask.png')
      ).rejects.toThrow('Failed to download mask')
    })
  })

  describe('ApiError', () => {
    it('correctly identifies auth errors', () => {
      const error = new ApiError('Auth failed', 401, 'AUTH_ERROR')
      expect(error.isAuthError).toBe(true)
      expect(error.isCreditsError).toBe(false)
      expect(error.isNetworkError).toBe(false)
    })

    it('correctly identifies credits errors', () => {
      const error = new ApiError('No credits', 402, 'CREDITS_ERROR')
      expect(error.isAuthError).toBe(false)
      expect(error.isCreditsError).toBe(true)
      expect(error.isNetworkError).toBe(false)
    })

    it('correctly identifies network errors', () => {
      const error = new ApiError('Network failed', 0, 'NETWORK_ERROR')
      expect(error.isAuthError).toBe(false)
      expect(error.isCreditsError).toBe(false)
      expect(error.isNetworkError).toBe(true)
    })
  })
})

/**
 * useAuth Composable Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { withSetup } from '@/test/utils'
import { useAuth } from '../useAuth'

describe('useAuth', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('starts with unauthenticated state', () => {
      const [auth, app] = withSetup(() => useAuth())

      expect(auth.isAuthenticated.value).toBe(false)
      expect(auth.isLoading.value).toBe(false)
      expect(auth.user.value).toBeNull()
      expect(auth.getToken()).toBeNull()

      app.unmount()
    })
  })

  describe('loadSavedToken', () => {
    it('returns false when no token in localStorage', async () => {
      const [auth, app] = withSetup(() => useAuth())

      const result = await auth.loadSavedToken()

      expect(result).toBe(false)
      expect(auth.isAuthenticated.value).toBe(false)

      app.unmount()
    })

    it('validates token from localStorage', async () => {
      localStorage.setItem('maskr_token', 'stored-token')

      // Mock successful API responses
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ email: 'test@example.com', total_credits: 100, plan_name: 'pro' }),
      }))

      const [auth, app] = withSetup(() => useAuth())

      const result = await auth.loadSavedToken()

      expect(result).toBe(true)
      expect(auth.isAuthenticated.value).toBe(true)

      app.unmount()
    })

    it('clears invalid token from localStorage', async () => {
      localStorage.setItem('maskr_token', 'invalid-token')

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      }))

      const [auth, app] = withSetup(() => useAuth())

      const result = await auth.loadSavedToken()

      expect(result).toBe(false)
      expect(localStorage.getItem('maskr_token')).toBeNull()

      app.unmount()
    })
  })

  describe('logout', () => {
    it('clears auth state', async () => {
      localStorage.setItem('maskr_token', 'stored-token')

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ email: 'test@example.com', total_credits: 100, plan_name: 'pro' }),
      }))

      const [auth, app] = withSetup(() => useAuth())

      await auth.loadSavedToken()
      expect(auth.isAuthenticated.value).toBe(true)

      auth.logout()

      expect(auth.isAuthenticated.value).toBe(false)
      expect(auth.user.value).toBeNull()
      expect(auth.getToken()).toBeNull()
      expect(localStorage.getItem('maskr_token')).toBeNull()

      app.unmount()
    })
  })

  describe('getToken', () => {
    it('returns null when not authenticated', () => {
      const [auth, app] = withSetup(() => useAuth())

      expect(auth.getToken()).toBeNull()

      app.unmount()
    })
  })

  describe('cancelLogin', () => {
    it('clears loading state', () => {
      const [auth, app] = withSetup(() => useAuth())

      // Manually set loading state (simulating in-progress login)
      auth.cancelLogin()

      expect(auth.isLoading.value).toBe(false)
      expect(auth.error.value).toBeNull()

      app.unmount()
    })
  })
})

/**
 * Authentication Composable
 *
 * Manages authentication state, OAuth flow, and token management.
 * Uses centralized config for URLs and settings.
 */

import { ref, computed, type ComputedRef } from 'vue'
import { config } from '@/config'
import type { AuthState, AuthMessage, User } from '@/types'

// =============================================================================
// Types
// =============================================================================

export interface AuthComposable {
  /** Whether the user is authenticated */
  isAuthenticated: ComputedRef<boolean>
  /** Whether an auth operation is in progress */
  isLoading: ComputedRef<boolean>
  /** Current user information */
  user: ComputedRef<User | null>
  /** Current error message */
  error: ComputedRef<string | null>
  /** Load token from storage and validate */
  loadSavedToken: () => Promise<boolean>
  /** Start the OAuth login flow */
  startLogin: () => Promise<void>
  /** Cancel the current login attempt */
  cancelLogin: () => void
  /** Log out and clear all auth state */
  logout: () => void
  /** Get the current auth token */
  getToken: () => string | null
  /** Refresh account info from server */
  refreshAccountInfo: () => Promise<void>
}

// =============================================================================
// Helpers
// =============================================================================

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// =============================================================================
// Composable
// =============================================================================

/**
 * Create an authentication composable instance
 *
 * Note: Use provideAuth() and useAuthContext() for app-wide auth state.
 * Direct usage of useAuth() creates a new instance each time.
 */
export function useAuth(): AuthComposable {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const state = ref<AuthState>({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  })

  // Active WebSocket connection (for cleanup)
  let activeWebSocket: WebSocket | null = null

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const isAuthenticated = computed(() => state.value.isAuthenticated)
  const isLoading = computed(() => state.value.isLoading)
  const user = computed(() => state.value.user)
  const error = computed(() => state.value.error)

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  async function fetchAccountInfo(token: string): Promise<boolean> {
    try {
      const [meResponse, balanceResponse] = await Promise.all([
        fetch(`${config.auth.apiUrl}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${config.billing.apiUrl}/billing/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (!meResponse.ok || !balanceResponse.ok) {
        return false
      }

      const meData = await meResponse.json()
      const balanceData = await balanceResponse.json()

      state.value.user = {
        email: meData.email,
        credits: balanceData.total_credits,
        plan: balanceData.plan_name,
      }

      return true
    } catch {
      return false
    }
  }

  function cleanupWebSocket() {
    if (activeWebSocket) {
      activeWebSocket.close()
      activeWebSocket = null
    }
  }

  function clearState() {
    state.value = {
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    }
  }

  // ---------------------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------------------

  async function loadSavedToken(): Promise<boolean> {
    const token = localStorage.getItem(config.auth.tokenKey)
    if (!token) return false

    state.value.isLoading = true

    try {
      const success = await fetchAccountInfo(token)

      if (success) {
        state.value.token = token
        state.value.isAuthenticated = true
      } else {
        localStorage.removeItem(config.auth.tokenKey)
      }

      return success
    } catch {
      localStorage.removeItem(config.auth.tokenKey)
      return false
    } finally {
      state.value.isLoading = false
    }
  }

  function startLogin(): Promise<void> {
    return new Promise((resolve, reject) => {
      state.value.isLoading = true
      state.value.error = null

      const sessionId = generateUUID()

      // Cleanup any existing connection
      cleanupWebSocket()

      // Set up timeout
      const timeoutId = setTimeout(() => {
        state.value.error = 'Login session timed out'
        cleanupWebSocket()
        state.value.isLoading = false
        reject(new Error('Login session timed out'))
      }, config.auth.loginTimeout)

      const cleanup = () => {
        clearTimeout(timeoutId)
        cleanupWebSocket()
        state.value.isLoading = false
      }

      try {
        const ws = new WebSocket(`${config.auth.wsUrl}/ws?session=${sessionId}`)
        activeWebSocket = ws

        ws.onmessage = async (event) => {
          try {
            const message: AuthMessage = JSON.parse(event.data)

            if (message.status === 'success' && message.token) {
              localStorage.setItem(config.auth.tokenKey, message.token)
              state.value.token = message.token
              await fetchAccountInfo(message.token)
              state.value.isAuthenticated = true
              cleanup()
              resolve()
            } else if (message.status === 'expired') {
              state.value.error = 'Login session expired'
              cleanup()
              reject(new Error('Session expired'))
            } else if (message.status === 'error') {
              state.value.error = message.error || 'Login failed'
              cleanup()
              reject(new Error(message.error || 'Login failed'))
            }
            // Ignore 'pending' status - it's just a heartbeat
          } catch {
            // Ignore parse errors
          }
        }

        ws.onerror = () => {
          state.value.error = 'Connection error'
          cleanup()
          reject(new Error('WebSocket error'))
        }

        ws.onclose = () => {
          // Only set as closed if we haven't already handled it
          if (activeWebSocket === ws) {
            activeWebSocket = null
          }
        }

        ws.onopen = () => {
          // Open auth URL in browser (never proxied)
          window.open(
            `${config.auth.browserUrl}/google?session=${sessionId}&plugin=penpot`,
            '_blank'
          )
        }
      } catch (err) {
        state.value.error = 'Failed to connect'
        cleanup()
        reject(err)
      }
    })
  }

  function cancelLogin() {
    cleanupWebSocket()
    state.value.isLoading = false
    state.value.error = null
  }

  function logout() {
    localStorage.removeItem(config.auth.tokenKey)
    cleanupWebSocket()
    clearState()
  }

  function getToken(): string | null {
    return state.value.token
  }

  async function refreshAccountInfo(): Promise<void> {
    if (!state.value.token) return
    await fetchAccountInfo(state.value.token)
  }

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    isAuthenticated,
    isLoading,
    user,
    error,
    loadSavedToken,
    startLogin,
    cancelLogin,
    logout,
    getToken,
    refreshAccountInfo,
  }
}

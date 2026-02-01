/**
 * Test Utilities
 *
 * Helper functions for testing Vue composables and components
 */

import { createApp, type App } from 'vue'
import { createPinia, setActivePinia, type Pinia } from 'pinia'

/**
 * Helper to test composables that require Vue's reactivity system
 *
 * @example
 * ```ts
 * const [result, app] = withSetup(() => useAuth())
 * expect(result.isAuthenticated.value).toBe(false)
 * app.unmount()
 * ```
 */
export function withSetup<T>(composable: () => T): [T, App] {
  let result: T
  const app = createApp({
    setup() {
      result = composable()
      return () => null
    },
  })

  // Set up Pinia
  const pinia = createPinia()
  app.use(pinia)

  app.mount(document.createElement('div'))
  // @ts-expect-error result is assigned in setup
  return [result, app]
}

/**
 * Create a fresh Pinia instance for testing
 */
export function createTestPinia(): Pinia {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

/**
 * Create a mock AbortSignal that can be manually aborted
 */
export function createMockAbortController(): {
  controller: AbortController
  abort: () => void
} {
  const controller = new AbortController()
  return {
    controller,
    abort: () => controller.abort(),
  }
}

/**
 * Wait for all pending promises to resolve
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Create a mock fetch response
 */
export function mockFetchResponse(data: unknown, options: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
}

/**
 * Create a mock fetch error response
 */
export function mockFetchError(status: number, statusText: string): Response {
  return new Response(null, { status, statusText })
}

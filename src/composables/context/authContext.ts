/**
 * Auth Context - Provide/Inject pattern for authentication state
 *
 * Replaces the singleton pattern with Vue's dependency injection,
 * making the code more testable and following Vue best practices.
 */

import { inject, provide, type InjectionKey } from 'vue'
import { useAuth, type AuthComposable } from '../useAuth'

/** Injection key for auth context */
export const AuthKey: InjectionKey<AuthComposable> = Symbol('auth')

/**
 * Provide auth context at the component tree root
 *
 * Call this in App.vue setup to make auth available to all descendants.
 *
 * @returns The auth composable instance
 *
 * @example
 * ```ts
 * // In App.vue
 * const auth = provideAuth()
 * ```
 */
export function provideAuth(): AuthComposable {
  const auth = useAuth()
  provide(AuthKey, auth)
  return auth
}

/**
 * Inject auth context in child components
 *
 * @throws Error if used outside of auth provider
 * @returns The auth composable instance
 *
 * @example
 * ```ts
 * // In any child component
 * const { isAuthenticated, user, login } = useAuthContext()
 * ```
 */
export function useAuthContext(): AuthComposable {
  const auth = inject(AuthKey)

  if (!auth) {
    throw new Error(
      'useAuthContext() was called outside of an auth provider. ' +
      'Make sure to call provideAuth() in a parent component.'
    )
  }

  return auth
}

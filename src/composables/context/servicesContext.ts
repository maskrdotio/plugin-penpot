/**
 * Services Context - Provide/Inject pattern for service dependencies
 *
 * Provides a clean dependency injection mechanism for services,
 * enabling testability and loose coupling between components.
 */

import { inject, provide, type InjectionKey } from 'vue'
import type { ApiService } from '@/services/ApiService'
import type { ImageProcessingService } from '@/services/ImageProcessingService'
import type { BackgroundRemovalService } from '@/services/BackgroundRemovalService'

// =============================================================================
// Types
// =============================================================================

/** All application services bundled together */
export interface Services {
  api: ApiService
  imageProcessing: ImageProcessingService
  backgroundRemoval: BackgroundRemovalService
}

/** Injection key for services context */
export const ServicesKey: InjectionKey<Services> = Symbol('services')

// =============================================================================
// Provider
// =============================================================================

/**
 * Provide services context at the component tree root
 *
 * Call this in App.vue setup to make services available to all descendants.
 *
 * @param services - The services bundle to provide
 *
 * @example
 * ```ts
 * // In App.vue
 * const api = createApiService(() => auth.getToken())
 * const imageProcessing = createImageProcessingService()
 * const backgroundRemoval = createBackgroundRemovalService(api, imageProcessing)
 *
 * provideServices({ api, imageProcessing, backgroundRemoval })
 * ```
 */
export function provideServices(services: Services): void {
  provide(ServicesKey, services)
}

// =============================================================================
// Consumer
// =============================================================================

/**
 * Inject services context in child components
 *
 * @throws Error if used outside of services provider
 * @returns The services bundle
 *
 * @example
 * ```ts
 * // In any child component
 * const { api, backgroundRemoval } = useServices()
 * ```
 */
export function useServices(): Services {
  const services = inject(ServicesKey)

  if (!services) {
    throw new Error(
      'useServices() was called outside of a services provider. ' +
      'Make sure to call provideServices() in a parent component.'
    )
  }

  return services
}

/**
 * Inject only the API service
 *
 * Convenience function when only API access is needed.
 */
export function useApiService(): ApiService {
  return useServices().api
}

/**
 * Inject only the background removal service
 *
 * Convenience function when only background removal is needed.
 */
export function useBackgroundRemovalService(): BackgroundRemovalService {
  return useServices().backgroundRemoval
}

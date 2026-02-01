/**
 * Composables barrel export
 */

// Core composables
export { useAuth, type AuthComposable } from './useAuth'
export { usePenpot, type PenpotComposable } from './usePenpot'
export { useProcessingState, type ProcessingStateComposable } from './useProcessingState'

// Controller composables
export { useProcessingController, type ProcessingController } from './useProcessingController'
export { useErrorHandler, type ErrorHandler, type ErrorState } from './useErrorHandler'

// Context providers
export {
  AuthKey,
  provideAuth,
  useAuthContext,
  ServicesKey,
  provideServices,
  useServices,
  useApiService,
  useBackgroundRemovalService,
  type Services,
} from './context'

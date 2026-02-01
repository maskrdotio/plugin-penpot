/**
 * Core Type Definitions
 *
 * Re-exports validated types from schemas where available.
 * Additional types that don't need runtime validation are defined here.
 */

// Re-export schema-validated types
export type {
  Theme,
  ToolId,
  AuthStatus,
  User,
  AuthMessage,
  RemoveBgResult,
  RemoveBgResponse,
  BatchResult,
  BatchResponse,
  AccountResponse,
  BalanceResponse,
  PenpotImageInfo,
  ThemeChangePayload,
  SelectionChangePayload,
  ImageDataPayload,
  ImageCreatedPayload,
  ErrorPayload,
  ExportImagePayload,
  CreateImageFromDataPayload,
  PluginToUIMessage,
  UIToPluginMessage,
} from '@/schemas'

// =============================================================================
// Tool Configuration Types
// =============================================================================

export interface Tool {
  id: import('@/schemas').ToolId
  name: string
  shortName: string
  icon: string
  description: string
  requiresSelection: boolean
  comingSoon?: boolean
}

// =============================================================================
// Auth State Types
// =============================================================================

export interface AuthState {
  token: string | null
  user: import('@/schemas').User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// =============================================================================
// Processing State Types
// =============================================================================

export interface ProcessingState {
  isProcessing: boolean
  progress: number
  status: string
  currentItem: number
  totalItems: number
}

export interface SelectedImage {
  id: string
  name: string
  data?: Uint8Array
}

// =============================================================================
// Legacy Types (for backward compatibility during migration)
// =============================================================================

/** @deprecated Use PluginToUIMessage['type'] instead */
export type PluginMessageType =
  | 'init'
  | 'theme-change'
  | 'selection-change'
  | 'image-data'
  | 'image-created'
  | 'error'

/** @deprecated Use PluginToUIMessage instead */
export interface PluginMessage {
  type: PluginMessageType
  payload?: unknown
}

/** @deprecated Use UIToPluginMessage['type'] instead */
export type UIMessageType =
  | 'get-selection'
  | 'export-image'
  | 'create-image-from-data'

/** @deprecated Use UIToPluginMessage instead */
export interface UIMessage {
  type: UIMessageType
  payload?: unknown
}

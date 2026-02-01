/**
 * Type-safe message definitions for plugin ↔ UI communication
 *
 * Uses discriminated unions for exhaustive type checking in message handlers.
 * Each message type has a specific payload shape that is validated at runtime.
 */

// =============================================================================
// Payload Types
// =============================================================================

/** Theme change payload from plugin context */
export interface ThemeChangePayload {
  theme: 'light' | 'dark'
}

/** Selection change payload containing selected images */
export interface SelectionChangePayload {
  count: number
  images: PenpotImageInfo[]
}

/** Image info from Penpot selection */
export interface PenpotImageInfo {
  id: string
  name: string
}

/** Image data exported from Penpot */
export interface ImageDataPayload {
  id: string
  data: number[]
}

/** Result of image creation in Penpot */
export interface ImageCreatedPayload {
  success: boolean
}

/** Error payload from plugin context */
export interface ErrorPayload {
  message: string
  code?: string
}

/** Request to export an image by ID */
export interface ExportImagePayload {
  id: string
}

/** Request to create an image from processed data */
export interface CreateImageFromDataPayload {
  name: string
  data: number[]
  sourceId: string
}

// =============================================================================
// Plugin → UI Messages (Discriminated Union)
// =============================================================================

export type PluginToUIMessage =
  | { type: 'init'; payload?: undefined }
  | { type: 'theme-change'; payload: ThemeChangePayload }
  | { type: 'selection-change'; payload: SelectionChangePayload }
  | { type: 'image-data'; payload: ImageDataPayload }
  | { type: 'image-created'; payload: ImageCreatedPayload }
  | { type: 'error'; payload: ErrorPayload }

/** Extract payload type for a specific message type */
export type PluginMessagePayload<T extends PluginToUIMessage['type']> = Extract<
  PluginToUIMessage,
  { type: T }
>['payload']

// =============================================================================
// UI → Plugin Messages (Discriminated Union)
// =============================================================================

export type UIToPluginMessage =
  | { type: 'get-selection'; payload?: undefined }
  | { type: 'export-image'; payload: ExportImagePayload }
  | { type: 'create-image-from-data'; payload: CreateImageFromDataPayload }

/** Extract payload type for a specific UI message type */
export type UIMessagePayload<T extends UIToPluginMessage['type']> = Extract<
  UIToPluginMessage,
  { type: T }
>['payload']

// =============================================================================
// Message Type Guards
// =============================================================================

/** All valid plugin message types */
export const PLUGIN_MESSAGE_TYPES = [
  'init',
  'theme-change',
  'selection-change',
  'image-data',
  'image-created',
  'error',
] as const

/** All valid UI message types */
export const UI_MESSAGE_TYPES = [
  'get-selection',
  'export-image',
  'create-image-from-data',
] as const

export type PluginMessageType = (typeof PLUGIN_MESSAGE_TYPES)[number]
export type UIMessageType = (typeof UI_MESSAGE_TYPES)[number]

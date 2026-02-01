/**
 * Penpot Bridge Composable
 *
 * Manages communication between the UI iframe and Penpot plugin context.
 * Features:
 * - Type-safe message handling with runtime validation
 * - Timeout protection for async operations
 * - Origin validation for security
 * - Proper cleanup on unmount
 */

import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import { config } from '@/config'
import { parsePluginMessage, isValidOrigin } from '@/utils/messageValidation'
import { withTimeout } from '@/utils/cleanup'
import type {
  UIToPluginMessage,
  PenpotImageInfo,
  CreateImageFromDataPayload,
} from '@/schemas'

// =============================================================================
// Types
// =============================================================================

export interface PenpotComposable {
  /** Current theme ('light' or 'dark') */
  theme: Ref<'light' | 'dark'>
  /** Currently selected images */
  selection: Ref<PenpotImageInfo[]>
  /** Whether the plugin is ready */
  isReady: Ref<boolean>
  /** Request current selection from plugin */
  requestSelection: () => void
  /**
   * Export an image from Penpot
   * @param id - The shape ID to export
   * @returns Image data as Uint8Array
   */
  exportImage: (id: string) => Promise<Uint8Array>
  /**
   * Create a new image in Penpot from processed data
   * @param name - Name for the new image
   * @param data - Image data as Uint8Array
   * @param sourceId - ID of the source shape (for positioning)
   */
  createImageFromData: (name: string, data: Uint8Array, sourceId: string) => void
}

// =============================================================================
// Composable
// =============================================================================

export function usePenpot(): PenpotComposable {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const theme = ref<'light' | 'dark'>('light')
  const selection = ref<PenpotImageInfo[]>([])
  const isReady = ref(false)

  // Track pending export requests for cleanup
  const pendingExports = new Map<string, {
    resolve: (data: Uint8Array) => void
    reject: (error: Error) => void
    cleanup: () => void
  }>()

  // ---------------------------------------------------------------------------
  // Message Sending
  // ---------------------------------------------------------------------------

  /**
   * Send a message to the plugin context
   * Uses specific origin in production for security
   */
  function sendMessage<T extends UIToPluginMessage['type']>(
    type: T,
    payload?: Extract<UIToPluginMessage, { type: T }>['payload']
  ) {
    const message = payload !== undefined ? { type, payload } : { type }

    // In production, use specific origin; in dev allow any for easier testing
    const targetOrigin = config.isDev ? '*' : config.penpot.allowedOrigins[0]
    parent.postMessage(message, targetOrigin)
  }

  // ---------------------------------------------------------------------------
  // Message Handling
  // ---------------------------------------------------------------------------

  /**
   * Handle incoming messages from plugin context
   * Validates origin and message structure before processing
   */
  function handleMessage(event: MessageEvent) {
    // Validate origin in production
    if (!isValidOrigin(event.origin, config.penpot.allowedOrigins, config.isDev)) {
      return
    }

    // Parse and validate message
    const message = parsePluginMessage(event)
    if (!message) return

    // Handle message by type (fully typed after validation)
    switch (message.type) {
      case 'init':
        isReady.value = true
        break

      case 'theme-change':
        theme.value = message.payload.theme
        break

      case 'selection-change':
        selection.value = message.payload.images
        break

      case 'image-data': {
        const { id, data } = message.payload
        const pending = pendingExports.get(id)
        if (pending) {
          pending.cleanup()
          pendingExports.delete(id)
          pending.resolve(new Uint8Array(data))
        }
        break
      }

      case 'image-created':
        // Could emit an event or update state if needed
        break

      case 'error': {
        // Check if this is a response to a pending export
        // For now, reject all pending exports on error
        const errorMessage = message.payload.message
        for (const [id, pending] of pendingExports) {
          pending.cleanup()
          pendingExports.delete(id)
          pending.reject(new Error(errorMessage))
        }
        break
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------------------

  function requestSelection() {
    sendMessage('get-selection')
  }

  function exportImage(id: string): Promise<Uint8Array> {
    // Check if already pending
    if (pendingExports.has(id)) {
      return Promise.reject(new Error(`Export already pending for ${id}`))
    }

    const exportPromise = new Promise<Uint8Array>((resolve, reject) => {
      // Create cleanup function
      const cleanup = () => {
        pendingExports.delete(id)
      }

      // Store pending request
      pendingExports.set(id, { resolve, reject, cleanup })

      // Request export
      sendMessage('export-image', { id })
    })

    // Wrap with timeout
    return withTimeout(
      exportPromise,
      config.penpot.messageTimeout,
      () => {
        // Cleanup on timeout
        const pending = pendingExports.get(id)
        if (pending) {
          pendingExports.delete(id)
        }
      }
    )
  }

  function createImageFromData(name: string, data: Uint8Array, sourceId: string) {
    const payload: CreateImageFromDataPayload = {
      name,
      data: Array.from(data),
      sourceId,
    }
    sendMessage('create-image-from-data', payload)
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  onMounted(() => {
    // Register message handler
    window.addEventListener('message', handleMessage)

    // Parse initial theme from URL
    const params = new URLSearchParams(window.location.search)
    const urlTheme = params.get('theme')
    if (urlTheme === 'light' || urlTheme === 'dark') {
      theme.value = urlTheme
    }
  })

  onUnmounted(() => {
    // Remove message handler
    window.removeEventListener('message', handleMessage)

    // Cleanup pending exports
    for (const [id, pending] of pendingExports) {
      pending.reject(new Error('Component unmounted'))
      pendingExports.delete(id)
    }
  })

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    theme,
    selection,
    isReady,
    requestSelection,
    exportImage,
    createImageFromData,
  }
}

/**
 * Penpot Plugin Entry Point
 *
 * Runs in Penpot's context with access to the penpot API.
 * Handles communication with the UI iframe via postMessage.
 */

import type { Shape } from '@penpot/plugin-types'

// =============================================================================
// Helpers
// =============================================================================

/**
 * Check if a shape has an image fill
 * Extracted to avoid duplication in selection filtering and image export
 */
function hasImageFill(shape: Shape): boolean {
  if (!penpot.utils.types.isRectangle(shape) && !penpot.utils.types.isEllipse(shape)) {
    return false
  }

  const fills = shape.fills
  if (!fills || !Array.isArray(fills)) {
    return false
  }

  return fills.some((fill) => fill.fillImage)
}

/**
 * Get image fill from a shape (if present)
 */
function getImageFill(shape: Shape) {
  if (!penpot.utils.types.isRectangle(shape) && !penpot.utils.types.isEllipse(shape)) {
    return undefined
  }

  const fills = shape.fills
  if (!fills || !Array.isArray(fills)) {
    return undefined
  }

  return fills.find((fill) => fill.fillImage)
}

// =============================================================================
// Plugin Initialization
// =============================================================================

// Base URL for the UI - injected at build time
const UI_BASE_URL = import.meta.env.PROD
  ? 'https://maskrdotio.github.io/plugin-penpot'
  : 'http://localhost:3000'

penpot.ui.open('Maskr.io', `${UI_BASE_URL}/?theme=${penpot.theme}`, {
  width: 360,
  height: 600,
})

// Send initial selection state
sendSelectionUpdate()

// =============================================================================
// Event Listeners
// =============================================================================

// Listen for theme changes
penpot.on('themechange', (theme) => {
  penpot.ui.sendMessage({
    type: 'theme-change',
    payload: { theme },
  })
})

// Listen for selection changes
penpot.on('selectionchange', () => {
  sendSelectionUpdate()
})

// Handle messages from UI
penpot.ui.onMessage((message: { type: string; payload?: unknown }) => {
  switch (message.type) {
    case 'get-selection':
      sendSelectionUpdate()
      break

    case 'export-image':
      handleExportImage(message.payload as { id: string })
      break

    case 'create-image-from-data':
      handleCreateImageFromData(
        message.payload as { name: string; data: number[]; sourceId: string }
      )
      break
  }
})

// =============================================================================
// Message Handlers
// =============================================================================

/**
 * Send current selection to UI
 */
function sendSelectionUpdate() {
  const selection = penpot.selection

  // Filter to shapes that can be processed
  // Include shapes with image fills, or any shape that can be exported
  const images = selection
    .filter((shape) => {
      // Prefer shapes with image fills (more efficient export)
      if (hasImageFill(shape)) {
        return true
      }
      // Include other shapes that can be exported as images
      return true
    })
    .map((shape) => ({
      id: shape.id,
      name: shape.name,
    }))

  penpot.ui.sendMessage({
    type: 'selection-change',
    payload: { count: images.length, images },
  })
}

/**
 * Export an image and send data to UI
 */
async function handleExportImage(payload: { id: string }) {
  try {
    const shape = penpot.selection.find((s) => s.id === payload.id)
    if (!shape) {
      penpot.ui.sendMessage({
        type: 'error',
        payload: { message: 'Shape not found' },
      })
      return
    }

    let data: Uint8Array

    // Try to get original image data from fills (much faster than export)
    const imageFill = getImageFill(shape)
    if (imageFill?.fillImage) {
      data = await imageFill.fillImage.data()
      penpot.ui.sendMessage({
        type: 'image-data',
        payload: {
          id: payload.id,
          data: Array.from(data),
        },
      })
      return
    }

    // Fallback: export as PNG (slower, but works for any shape)
    data = await shape.export({ type: 'png', scale: 1 })

    penpot.ui.sendMessage({
      type: 'image-data',
      payload: {
        id: payload.id,
        data: Array.from(data),
      },
    })
  } catch (err) {
    penpot.ui.sendMessage({
      type: 'error',
      payload: {
        message: err instanceof Error ? err.message : 'Export failed',
      },
    })
  }
}

/**
 * Create a new image in Penpot from processed data
 */
async function handleCreateImageFromData(payload: {
  name: string
  data: number[]
  sourceId: string
}) {
  try {
    const sourceShape = penpot.selection.find((s) => s.id === payload.sourceId)
    if (!sourceShape) {
      console.error('Source shape not found')
      penpot.ui.sendMessage({
        type: 'error',
        payload: { message: 'Source shape not found' },
      })
      return
    }

    // Convert data array back to Uint8Array
    const data = new Uint8Array(payload.data)

    // Upload the image data to Penpot
    const imageData = await penpot.uploadMediaData(
      payload.name,
      data,
      'image/png'
    )

    // Create a new rectangle with the image fill
    const rect = penpot.createRectangle()
    if (rect) {
      rect.name = payload.name
      rect.x = sourceShape.x + sourceShape.width + 20
      rect.y = sourceShape.y
      rect.resize(sourceShape.width, sourceShape.height)
      rect.fills = [{ fillOpacity: 1, fillImage: imageData }]
    }

    penpot.ui.sendMessage({
      type: 'image-created',
      payload: { success: true },
    })
  } catch (err) {
    console.error('Failed to create image:', err)
    penpot.ui.sendMessage({
      type: 'error',
      payload: {
        message: err instanceof Error ? err.message : 'Failed to create image',
      },
    })
  }
}

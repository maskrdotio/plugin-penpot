/**
 * Runtime validation utilities for plugin messages
 *
 * Uses Zod schemas for runtime validation, providing both
 * type safety and detailed error messages.
 */

import {
  safeParsePluginMessage as zodSafeParsePluginMessage,
  isPluginMessage as zodIsPluginMessage,
  type PluginToUIMessage,
} from '@/schemas'

// Re-export Zod-based validation functions
export { isPluginMessage } from '@/schemas'

/**
 * Parse and validate a plugin message from a MessageEvent
 *
 * @param event - The MessageEvent to parse
 * @returns The validated message or null if invalid
 */
export function parsePluginMessage(event: MessageEvent): PluginToUIMessage | null {
  return zodSafeParsePluginMessage(event.data)
}

/**
 * Validate message origin against allowed origins
 *
 * @param origin - The origin to validate
 * @param allowedOrigins - List of allowed origins
 * @param isDev - Whether in development mode (relaxes validation)
 * @returns true if origin is valid
 */
export function isValidOrigin(
  origin: string,
  allowedOrigins: readonly string[],
  isDev: boolean
): boolean {
  // In dev mode, allow all origins for easier testing
  if (isDev) return true

  // Check against allowed origins
  return allowedOrigins.includes(origin)
}

/**
 * Validate a message and provide detailed error info
 * Useful for debugging message validation issues
 */
export function validateMessageWithDetails(data: unknown): {
  valid: boolean
  message?: PluginToUIMessage
  error?: string
} {
  if (!zodIsPluginMessage(data)) {
    return {
      valid: false,
      error: `Invalid message structure: ${JSON.stringify(data)}`,
    }
  }

  const parsed = zodSafeParsePluginMessage(data)
  if (!parsed) {
    return {
      valid: false,
      error: `Message type "${(data as Record<string, unknown>).type}" has invalid payload`,
    }
  }

  return {
    valid: true,
    message: parsed,
  }
}

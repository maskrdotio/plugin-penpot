/**
 * Zod Schemas - Runtime Validation with Type Inference
 *
 * Single source of truth for types and runtime validation.
 * All types are inferred from schemas, ensuring consistency.
 */

import { z } from 'zod'

// =============================================================================
// Base Schemas
// =============================================================================

/** Theme values */
export const ThemeSchema = z.enum(['light', 'dark'])
export type Theme = z.infer<typeof ThemeSchema>

/** Tool identifiers */
export const ToolIdSchema = z.enum(['remove-bg', 'upscale', 'inpaint', 'segment', 'icon-gen'])
export type ToolId = z.infer<typeof ToolIdSchema>

/** Auth status values */
export const AuthStatusSchema = z.enum(['pending', 'success', 'expired', 'error'])
export type AuthStatus = z.infer<typeof AuthStatusSchema>

// =============================================================================
// API Response Schemas
// =============================================================================

export const RemoveBgResultSchema = z.object({
  output_url: z.string().url(),
  credits_used: z.number().int().nonnegative(),
})
export type RemoveBgResult = z.infer<typeof RemoveBgResultSchema>

export const RemoveBgResponseSchema = z.object({
  result: RemoveBgResultSchema,
})
export type RemoveBgResponse = z.infer<typeof RemoveBgResponseSchema>

export const BatchResultSchema = z.object({
  status: z.enum(['success', 'error']),
  output_url: z.string().url().optional(),
  credits_used: z.number().int().nonnegative().optional(),
  error: z.string().optional(),
})
export type BatchResult = z.infer<typeof BatchResultSchema>

export const BatchResponseSchema = z.object({
  results: z.array(BatchResultSchema),
})
export type BatchResponse = z.infer<typeof BatchResponseSchema>

export const AccountResponseSchema = z.object({
  email: z.string().email(),
})
export type AccountResponse = z.infer<typeof AccountResponseSchema>

export const BalanceResponseSchema = z.object({
  credits: z.number().int().nonnegative(),
  plan: z.string(),
})
export type BalanceResponse = z.infer<typeof BalanceResponseSchema>

// =============================================================================
// Auth Schemas
// =============================================================================

export const UserSchema = z.object({
  email: z.string().email(),
  credits: z.number().int().nonnegative(),
  plan: z.string(),
})
export type User = z.infer<typeof UserSchema>

export const AuthMessageSchema = z.object({
  status: AuthStatusSchema,
  token: z.string().optional(),
  error: z.string().optional(),
})
export type AuthMessage = z.infer<typeof AuthMessageSchema>

// =============================================================================
// Plugin Message Schemas
// =============================================================================

/** Penpot image info from selection */
export const PenpotImageInfoSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
})
export type PenpotImageInfo = z.infer<typeof PenpotImageInfoSchema>

/** Theme change payload */
export const ThemeChangePayloadSchema = z.object({
  theme: ThemeSchema,
})
export type ThemeChangePayload = z.infer<typeof ThemeChangePayloadSchema>

/** Selection change payload */
export const SelectionChangePayloadSchema = z.object({
  count: z.number().int().nonnegative(),
  images: z.array(PenpotImageInfoSchema),
})
export type SelectionChangePayload = z.infer<typeof SelectionChangePayloadSchema>

/** Image data payload */
export const ImageDataPayloadSchema = z.object({
  id: z.string().min(1),
  data: z.array(z.number().int().min(0).max(255)),
})
export type ImageDataPayload = z.infer<typeof ImageDataPayloadSchema>

/** Image created payload */
export const ImageCreatedPayloadSchema = z.object({
  success: z.boolean(),
})
export type ImageCreatedPayload = z.infer<typeof ImageCreatedPayloadSchema>

/** Error payload */
export const ErrorPayloadSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
})
export type ErrorPayload = z.infer<typeof ErrorPayloadSchema>

/** Export image request payload */
export const ExportImagePayloadSchema = z.object({
  id: z.string().min(1),
})
export type ExportImagePayload = z.infer<typeof ExportImagePayloadSchema>

/** Create image from data payload */
export const CreateImageFromDataPayloadSchema = z.object({
  name: z.string().min(1),
  data: z.array(z.number().int().min(0).max(255)),
  sourceId: z.string().min(1),
})
export type CreateImageFromDataPayload = z.infer<typeof CreateImageFromDataPayloadSchema>

// =============================================================================
// Discriminated Union Message Schemas
// =============================================================================

/** All messages from Plugin → UI */
export const PluginToUIMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('init'), payload: z.undefined().optional() }),
  z.object({ type: z.literal('theme-change'), payload: ThemeChangePayloadSchema }),
  z.object({ type: z.literal('selection-change'), payload: SelectionChangePayloadSchema }),
  z.object({ type: z.literal('image-data'), payload: ImageDataPayloadSchema }),
  z.object({ type: z.literal('image-created'), payload: ImageCreatedPayloadSchema }),
  z.object({ type: z.literal('error'), payload: ErrorPayloadSchema }),
])
export type PluginToUIMessage = z.infer<typeof PluginToUIMessageSchema>

/** All messages from UI → Plugin */
export const UIToPluginMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('get-selection'), payload: z.undefined().optional() }),
  z.object({ type: z.literal('export-image'), payload: ExportImagePayloadSchema }),
  z.object({ type: z.literal('create-image-from-data'), payload: CreateImageFromDataPayloadSchema }),
])
export type UIToPluginMessage = z.infer<typeof UIToPluginMessageSchema>

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Validate and parse a Plugin → UI message
 * @throws {z.ZodError} if validation fails
 */
export function parsePluginMessage(data: unknown): PluginToUIMessage {
  return PluginToUIMessageSchema.parse(data)
}

/**
 * Safely parse a Plugin → UI message (returns null on failure)
 */
export function safeParsePluginMessage(data: unknown): PluginToUIMessage | null {
  const result = PluginToUIMessageSchema.safeParse(data)
  return result.success ? result.data : null
}

/**
 * Validate and parse a UI → Plugin message
 * @throws {z.ZodError} if validation fails
 */
export function parseUIMessage(data: unknown): UIToPluginMessage {
  return UIToPluginMessageSchema.parse(data)
}

/**
 * Safely parse a UI → Plugin message (returns null on failure)
 */
export function safeParseUIMessage(data: unknown): UIToPluginMessage | null {
  const result = UIToPluginMessageSchema.safeParse(data)
  return result.success ? result.data : null
}

/**
 * Validate an auth message from WebSocket
 */
export function parseAuthMessage(data: unknown): AuthMessage {
  return AuthMessageSchema.parse(data)
}

/**
 * Safely parse an auth message (returns null on failure)
 */
export function safeParseAuthMessage(data: unknown): AuthMessage | null {
  const result = AuthMessageSchema.safeParse(data)
  return result.success ? result.data : null
}

// =============================================================================
// Type Guards (for cases where you need boolean checks)
// =============================================================================

export function isPluginMessage(data: unknown): data is PluginToUIMessage {
  return PluginToUIMessageSchema.safeParse(data).success
}

export function isUIMessage(data: unknown): data is UIToPluginMessage {
  return UIToPluginMessageSchema.safeParse(data).success
}

export function isAuthMessage(data: unknown): data is AuthMessage {
  return AuthMessageSchema.safeParse(data).success
}

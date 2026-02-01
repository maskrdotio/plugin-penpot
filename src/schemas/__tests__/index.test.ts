/**
 * Zod Schema Tests
 */

import { describe, it, expect } from 'vitest'
import {
  ThemeSchema,
  ToolIdSchema,
  AuthStatusSchema,
  UserSchema,
  PenpotImageInfoSchema,
  PluginToUIMessageSchema,
  UIToPluginMessageSchema,
  parsePluginMessage,
  safeParsePluginMessage,
  parseAuthMessage,
  isPluginMessage,
  isUIMessage,
} from '../index'

describe('Zod Schemas', () => {
  describe('ThemeSchema', () => {
    it('accepts valid themes', () => {
      expect(ThemeSchema.parse('light')).toBe('light')
      expect(ThemeSchema.parse('dark')).toBe('dark')
    })

    it('rejects invalid themes', () => {
      expect(() => ThemeSchema.parse('blue')).toThrow()
    })
  })

  describe('ToolIdSchema', () => {
    it('accepts valid tool IDs', () => {
      expect(ToolIdSchema.parse('remove-bg')).toBe('remove-bg')
      expect(ToolIdSchema.parse('upscale')).toBe('upscale')
    })

    it('rejects invalid tool IDs', () => {
      expect(() => ToolIdSchema.parse('invalid-tool')).toThrow()
    })
  })

  describe('AuthStatusSchema', () => {
    it('accepts valid statuses', () => {
      expect(AuthStatusSchema.parse('pending')).toBe('pending')
      expect(AuthStatusSchema.parse('success')).toBe('success')
      expect(AuthStatusSchema.parse('expired')).toBe('expired')
      expect(AuthStatusSchema.parse('error')).toBe('error')
    })
  })

  describe('UserSchema', () => {
    it('accepts valid user objects', () => {
      const user = {
        email: 'test@example.com',
        credits: 100,
        plan: 'pro',
      }
      expect(UserSchema.parse(user)).toEqual(user)
    })

    it('rejects invalid email', () => {
      const user = {
        email: 'invalid-email',
        credits: 100,
        plan: 'pro',
      }
      expect(() => UserSchema.parse(user)).toThrow()
    })

    it('rejects negative credits', () => {
      const user = {
        email: 'test@example.com',
        credits: -10,
        plan: 'pro',
      }
      expect(() => UserSchema.parse(user)).toThrow()
    })
  })

  describe('PenpotImageInfoSchema', () => {
    it('accepts valid image info', () => {
      const info = { id: 'abc123', name: 'My Image' }
      expect(PenpotImageInfoSchema.parse(info)).toEqual(info)
    })

    it('rejects empty id', () => {
      const info = { id: '', name: 'My Image' }
      expect(() => PenpotImageInfoSchema.parse(info)).toThrow()
    })
  })

  describe('PluginToUIMessageSchema', () => {
    it('accepts init message', () => {
      const msg = { type: 'init' }
      const result = PluginToUIMessageSchema.parse(msg)
      expect(result.type).toBe('init')
    })

    it('accepts theme-change message', () => {
      const msg = { type: 'theme-change', payload: { theme: 'dark' } }
      const result = PluginToUIMessageSchema.parse(msg)
      expect(result.type).toBe('theme-change')
      if (result.type === 'theme-change') {
        expect(result.payload.theme).toBe('dark')
      }
    })

    it('accepts selection-change message', () => {
      const msg = {
        type: 'selection-change',
        payload: {
          count: 2,
          images: [
            { id: '1', name: 'Image 1' },
            { id: '2', name: 'Image 2' },
          ],
        },
      }
      const result = PluginToUIMessageSchema.parse(msg)
      expect(result.type).toBe('selection-change')
      if (result.type === 'selection-change') {
        expect(result.payload.images).toHaveLength(2)
      }
    })

    it('accepts image-data message', () => {
      const msg = {
        type: 'image-data',
        payload: { id: 'abc', data: [1, 2, 3, 255] },
      }
      const result = PluginToUIMessageSchema.parse(msg)
      expect(result.type).toBe('image-data')
    })

    it('accepts error message', () => {
      const msg = {
        type: 'error',
        payload: { message: 'Something went wrong', code: 'ERR_001' },
      }
      const result = PluginToUIMessageSchema.parse(msg)
      expect(result.type).toBe('error')
    })

    it('rejects unknown message type', () => {
      const msg = { type: 'unknown' }
      expect(() => PluginToUIMessageSchema.parse(msg)).toThrow()
    })

    it('rejects invalid payload', () => {
      const msg = { type: 'theme-change', payload: { theme: 'invalid' } }
      expect(() => PluginToUIMessageSchema.parse(msg)).toThrow()
    })
  })

  describe('UIToPluginMessageSchema', () => {
    it('accepts get-selection message', () => {
      const msg = { type: 'get-selection' }
      const result = UIToPluginMessageSchema.parse(msg)
      expect(result.type).toBe('get-selection')
    })

    it('accepts export-image message', () => {
      const msg = { type: 'export-image', payload: { id: 'abc123' } }
      const result = UIToPluginMessageSchema.parse(msg)
      expect(result.type).toBe('export-image')
    })

    it('accepts create-image-from-data message', () => {
      const msg = {
        type: 'create-image-from-data',
        payload: {
          name: 'New Image',
          data: [1, 2, 3],
          sourceId: 'src123',
        },
      }
      const result = UIToPluginMessageSchema.parse(msg)
      expect(result.type).toBe('create-image-from-data')
    })
  })

  describe('parsePluginMessage', () => {
    it('parses valid message', () => {
      const msg = { type: 'init' }
      const result = parsePluginMessage(msg)
      expect(result.type).toBe('init')
    })

    it('throws on invalid message', () => {
      expect(() => parsePluginMessage({ type: 'invalid' })).toThrow()
    })
  })

  describe('safeParsePluginMessage', () => {
    it('returns message on success', () => {
      const msg = { type: 'init' }
      const result = safeParsePluginMessage(msg)
      expect(result?.type).toBe('init')
    })

    it('returns null on failure', () => {
      const result = safeParsePluginMessage({ type: 'invalid' })
      expect(result).toBeNull()
    })
  })

  describe('parseAuthMessage', () => {
    it('parses valid auth message', () => {
      const msg = { status: 'success', token: 'abc123' }
      const result = parseAuthMessage(msg)
      expect(result.status).toBe('success')
      expect(result.token).toBe('abc123')
    })
  })

  describe('type guards', () => {
    it('isPluginMessage returns true for valid messages', () => {
      expect(isPluginMessage({ type: 'init' })).toBe(true)
      expect(isPluginMessage({ type: 'theme-change', payload: { theme: 'dark' } })).toBe(true)
    })

    it('isPluginMessage returns false for invalid messages', () => {
      expect(isPluginMessage({ type: 'invalid' })).toBe(false)
      expect(isPluginMessage(null)).toBe(false)
      expect(isPluginMessage('string')).toBe(false)
    })

    it('isUIMessage returns true for valid messages', () => {
      expect(isUIMessage({ type: 'get-selection' })).toBe(true)
    })

    it('isUIMessage returns false for invalid messages', () => {
      expect(isUIMessage({ type: 'invalid' })).toBe(false)
    })
  })
})

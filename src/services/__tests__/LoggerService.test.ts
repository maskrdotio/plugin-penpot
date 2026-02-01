/**
 * LoggerService Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createLogger, logger } from '../LoggerService'

describe('LoggerService', () => {
  beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('createLogger', () => {
    it('creates a logger instance', () => {
      const log = createLogger()
      expect(log).toBeDefined()
      expect(log.debug).toBeDefined()
      expect(log.info).toBeDefined()
      expect(log.warn).toBeDefined()
      expect(log.error).toBeDefined()
    })

    it('creates a namespaced logger', () => {
      const log = createLogger('TestNamespace')
      log.info('test event', { key: 'value' })

      expect(console.info).toHaveBeenCalled()
      const loggedMessage = (console.info as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(loggedMessage).toContain('TestNamespace')
      expect(loggedMessage).toContain('test event')
    })
  })

  describe('logger methods', () => {
    it('logs debug messages', () => {
      const log = createLogger()
      log.debug('debug event', { data: 'test' })

      expect(console.debug).toHaveBeenCalled()
    })

    it('logs info messages', () => {
      const log = createLogger()
      log.info('info event', { data: 'test' })

      expect(console.info).toHaveBeenCalled()
    })

    it('logs warn messages', () => {
      const log = createLogger()
      log.warn('warn event', { data: 'test' })

      expect(console.warn).toHaveBeenCalled()
    })

    it('logs error messages with Error object', () => {
      const log = createLogger()
      const error = new Error('Test error')
      log.error('error event', error, { context: 'test' })

      expect(console.error).toHaveBeenCalled()
      const loggedMessage = (console.error as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(loggedMessage).toContain('error event')
      expect(loggedMessage).toContain('Test error')
    })
  })

  describe('log entry format', () => {
    it('includes timestamp in log entry', () => {
      const log = createLogger()
      const before = Date.now()
      log.info('test event')
      const after = Date.now()

      const loggedMessage = (console.info as ReturnType<typeof vi.fn>).mock.calls[0][0]
      const parsed = JSON.parse(loggedMessage)
      expect(parsed.timestamp).toBeGreaterThanOrEqual(before)
      expect(parsed.timestamp).toBeLessThanOrEqual(after)
    })

    it('includes level in log entry', () => {
      const log = createLogger()
      log.warn('test event')

      const loggedMessage = (console.warn as ReturnType<typeof vi.fn>).mock.calls[0][0]
      const parsed = JSON.parse(loggedMessage)
      expect(parsed.level).toBe('warn')
    })

    it('includes event name in log entry', () => {
      const log = createLogger()
      log.info('my-custom-event')

      const loggedMessage = (console.info as ReturnType<typeof vi.fn>).mock.calls[0][0]
      const parsed = JSON.parse(loggedMessage)
      expect(parsed.event).toBe('my-custom-event')
    })

    it('includes data in log entry', () => {
      const log = createLogger()
      log.info('test event', { key: 'value', count: 42 })

      const loggedMessage = (console.info as ReturnType<typeof vi.fn>).mock.calls[0][0]
      const parsed = JSON.parse(loggedMessage)
      expect(parsed.data).toEqual({ key: 'value', count: 42 })
    })

    it('includes error stack in log entry', () => {
      const log = createLogger()
      const error = new Error('Test error')
      log.error('error event', error)

      const loggedMessage = (console.error as ReturnType<typeof vi.fn>).mock.calls[0][0]
      const parsed = JSON.parse(loggedMessage)
      expect(parsed.message).toBe('Test error')
      expect(parsed.data?.stack).toBeDefined()
      expect(parsed.data?.name).toBe('Error')
    })
  })

  describe('default logger instance', () => {
    it('exports default logger', () => {
      expect(logger).toBeDefined()
      expect(logger.info).toBeDefined()
    })
  })
})

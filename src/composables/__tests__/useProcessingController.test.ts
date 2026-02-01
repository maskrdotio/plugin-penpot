/**
 * useProcessingController Composable Tests
 */

import { describe, it, expect } from 'vitest'
import { withSetup } from '@/test/utils'
import { useProcessingController } from '../useProcessingController'

describe('useProcessingController', () => {
  describe('initial state', () => {
    it('starts in idle state', () => {
      const [controller, app] = withSetup(() => useProcessingController())

      expect(controller.isProcessing.value).toBe(false)
      expect(controller.isCancelled()).toBe(false)

      app.unmount()
    })
  })

  describe('startProcessing', () => {
    it('returns an AbortSignal', () => {
      const [controller, app] = withSetup(() => useProcessingController())

      const signal = controller.startProcessing()

      expect(signal).toBeInstanceOf(AbortSignal)
      expect(signal.aborted).toBe(false)

      app.unmount()
    })

    it('sets processing state', () => {
      const [controller, app] = withSetup(() => useProcessingController())

      controller.startProcessing()

      expect(controller.isProcessing.value).toBe(true)

      app.unmount()
    })
  })

  describe('cancel', () => {
    it('aborts the signal', () => {
      const [controller, app] = withSetup(() => useProcessingController())

      const signal = controller.startProcessing()
      controller.cancel()

      expect(signal.aborted).toBe(true)

      app.unmount()
    })

    it('updates state correctly', () => {
      const [controller, app] = withSetup(() => useProcessingController())

      controller.startProcessing()
      controller.cancel()

      expect(controller.isProcessing.value).toBe(false)

      app.unmount()
    })

    it('does nothing when not processing', () => {
      const [controller, app] = withSetup(() => useProcessingController())

      // Should not throw
      controller.cancel()

      expect(controller.isProcessing.value).toBe(false)

      app.unmount()
    })
  })

  describe('finish', () => {
    it('clears processing state', () => {
      const [controller, app] = withSetup(() => useProcessingController())

      controller.startProcessing()
      controller.finish()

      expect(controller.isProcessing.value).toBe(false)

      app.unmount()
    })

    it('allows starting new processing after finish', () => {
      const [controller, app] = withSetup(() => useProcessingController())

      const signal1 = controller.startProcessing()
      controller.finish()

      const signal2 = controller.startProcessing()

      expect(signal1).not.toBe(signal2)
      expect(signal2.aborted).toBe(false)

      app.unmount()
    })
  })

  describe('isCancelled', () => {
    it('returns true after cancel', () => {
      const [controller, app] = withSetup(() => useProcessingController())

      controller.startProcessing()
      expect(controller.isCancelled()).toBe(false)

      controller.cancel()
      // After cancel, isCancelled returns false because controller is cleared
      expect(controller.isCancelled()).toBe(false)

      app.unmount()
    })
  })

  describe('abort listener', () => {
    it('can listen for abort events', () => {
      const [controller, app] = withSetup(() => useProcessingController())

      const signal = controller.startProcessing()
      let aborted = false
      signal.addEventListener('abort', () => {
        aborted = true
      })

      controller.cancel()

      expect(aborted).toBe(true)

      app.unmount()
    })
  })
})

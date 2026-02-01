/**
 * Processing Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createTestPinia } from '@/test/utils'
import { useProcessingStore } from '../processingStore'

describe('processingStore', () => {
  beforeEach(() => {
    createTestPinia()
  })

  describe('initial state', () => {
    it('starts with empty jobs and idle status', () => {
      const store = useProcessingStore()

      expect(store.jobs).toEqual([])
      expect(store.history).toEqual([])
      expect(store.status).toBe('idle')
      expect(store.isProcessing).toBe(false)
    })
  })

  describe('startBatch', () => {
    it('creates jobs from items', () => {
      const store = useProcessingStore()
      const items = [
        { id: '1', name: 'Image 1' },
        { id: '2', name: 'Image 2' },
      ]

      store.startBatch(items)

      expect(store.jobs).toHaveLength(2)
      expect(store.jobs[0]).toMatchObject({
        id: '1',
        name: 'Image 1',
        status: 'pending',
        progress: 0,
      })
    })

    it('returns an AbortSignal', () => {
      const store = useProcessingStore()
      const signal = store.startBatch([{ id: '1', name: 'Test' }])

      expect(signal).toBeInstanceOf(AbortSignal)
      expect(signal.aborted).toBe(false)
    })

    it('sets status to processing', () => {
      const store = useProcessingStore()
      store.startBatch([{ id: '1', name: 'Test' }])

      expect(store.status).toBe('processing')
      expect(store.isProcessing).toBe(true)
    })
  })

  describe('updateJobProgress', () => {
    it('updates progress and stage for a job', () => {
      const store = useProcessingStore()
      store.startBatch([{ id: '1', name: 'Test' }])

      store.updateJobProgress('1', 50, 'Processing...')

      expect(store.jobs[0].progress).toBe(50)
      expect(store.jobs[0].stage).toBe('Processing...')
      expect(store.jobs[0].status).toBe('processing')
    })

    it('sets startedAt when job transitions from pending', () => {
      const store = useProcessingStore()
      store.startBatch([{ id: '1', name: 'Test' }])

      const before = Date.now()
      store.updateJobProgress('1', 10, 'Starting...')
      const after = Date.now()

      expect(store.jobs[0].startedAt).toBeGreaterThanOrEqual(before)
      expect(store.jobs[0].startedAt).toBeLessThanOrEqual(after)
    })
  })

  describe('completeJob', () => {
    it('marks job as completed', () => {
      const store = useProcessingStore()
      store.startBatch([{ id: '1', name: 'Test' }])
      store.updateJobProgress('1', 50, 'Processing...')

      store.completeJob('1')

      expect(store.jobs[0].status).toBe('completed')
      expect(store.jobs[0].progress).toBe(100)
      expect(store.jobs[0].stage).toBe('Done')
    })

    it('adds to history', () => {
      const store = useProcessingStore()
      store.startBatch([{ id: '1', name: 'Test' }])
      store.completeJob('1')

      expect(store.history).toHaveLength(1)
      expect(store.history[0]).toMatchObject({
        id: '1',
        name: 'Test',
        status: 'completed',
      })
    })
  })

  describe('failJob', () => {
    it('marks job as failed with error', () => {
      const store = useProcessingStore()
      store.startBatch([{ id: '1', name: 'Test' }])

      store.failJob('1', 'Something went wrong')

      expect(store.jobs[0].status).toBe('failed')
      expect(store.jobs[0].error).toBe('Something went wrong')
    })

    it('adds to history with error', () => {
      const store = useProcessingStore()
      store.startBatch([{ id: '1', name: 'Test' }])
      store.failJob('1', 'Error message')

      expect(store.history[0]).toMatchObject({
        status: 'failed',
        error: 'Error message',
      })
    })
  })

  describe('cancel', () => {
    it('aborts the signal', () => {
      const store = useProcessingStore()
      const signal = store.startBatch([{ id: '1', name: 'Test' }])

      store.cancel()

      expect(signal.aborted).toBe(true)
    })

    it('marks pending jobs as cancelled', () => {
      const store = useProcessingStore()
      store.startBatch([
        { id: '1', name: 'Test 1' },
        { id: '2', name: 'Test 2' },
      ])

      store.cancel()

      expect(store.jobs[0].status).toBe('cancelled')
      expect(store.jobs[1].status).toBe('cancelled')
    })

    it('sets status to cancelled', () => {
      const store = useProcessingStore()
      store.startBatch([{ id: '1', name: 'Test' }])

      store.cancel()

      expect(store.status).toBe('cancelled')
    })
  })

  describe('finish', () => {
    it('clears abort controller and sets status to idle', () => {
      const store = useProcessingStore()
      store.startBatch([{ id: '1', name: 'Test' }])

      store.finish()

      expect(store.status).toBe('idle')
      expect(store.isProcessing).toBe(false)
    })
  })

  describe('reset', () => {
    it('clears all state', () => {
      const store = useProcessingStore()
      store.startBatch([{ id: '1', name: 'Test' }])
      store.completeJob('1')

      store.reset()

      expect(store.jobs).toEqual([])
      expect(store.status).toBe('idle')
    })
  })

  describe('computed properties', () => {
    it('currentJob returns the processing job', () => {
      const store = useProcessingStore()
      store.startBatch([
        { id: '1', name: 'Test 1' },
        { id: '2', name: 'Test 2' },
      ])
      store.updateJobProgress('1', 50, 'Processing...')

      expect(store.currentJob?.id).toBe('1')
    })

    it('pendingCount returns correct count', () => {
      const store = useProcessingStore()
      store.startBatch([
        { id: '1', name: 'Test 1' },
        { id: '2', name: 'Test 2' },
        { id: '3', name: 'Test 3' },
      ])
      store.completeJob('1')

      expect(store.pendingCount).toBe(2)
    })

    it('completedCount returns correct count', () => {
      const store = useProcessingStore()
      store.startBatch([
        { id: '1', name: 'Test 1' },
        { id: '2', name: 'Test 2' },
      ])
      store.completeJob('1')

      expect(store.completedCount).toBe(1)
    })

    it('overallProgress calculates correctly', () => {
      const store = useProcessingStore()
      store.startBatch([
        { id: '1', name: 'Test 1' },
        { id: '2', name: 'Test 2' },
      ])
      store.completeJob('1')
      store.updateJobProgress('2', 50, 'Half done')

      // 1 completed (100%) + 1 at 50% = 75% overall
      expect(store.overallProgress).toBe(75)
    })

    it('canCancel is true when processing', () => {
      const store = useProcessingStore()
      expect(store.canCancel).toBe(false)

      store.startBatch([{ id: '1', name: 'Test' }])
      expect(store.canCancel).toBe(true)

      store.finish()
      expect(store.canCancel).toBe(false)
    })
  })
})

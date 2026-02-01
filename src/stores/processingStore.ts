/**
 * Processing Store - Pinia store for image processing state
 *
 * Manages:
 * - Processing queue and status
 * - Processing history
 * - AbortController for cancellation
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// =============================================================================
// Types
// =============================================================================

export interface ProcessingJob {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  stage: string
  error?: string
  startedAt?: number
  completedAt?: number
}

export interface ProcessingHistoryItem {
  id: string
  name: string
  status: 'completed' | 'failed' | 'cancelled'
  duration: number
  timestamp: number
  error?: string
}

// =============================================================================
// Store
// =============================================================================

export const useProcessingStore = defineStore('processing', () => {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  /** Current processing jobs */
  const jobs = ref<ProcessingJob[]>([])

  /** Processing history */
  const history = ref<ProcessingHistoryItem[]>([])

  /** Active AbortController for cancellation */
  const abortController = ref<AbortController | null>(null)

  /** Overall processing status */
  const status = ref<'idle' | 'processing' | 'cancelled'>('idle')

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  /** Whether processing is currently active */
  const isProcessing = computed(() => status.value === 'processing')

  /** Current job being processed */
  const currentJob = computed(() =>
    jobs.value.find((job) => job.status === 'processing')
  )

  /** Number of pending jobs */
  const pendingCount = computed(() =>
    jobs.value.filter((job) => job.status === 'pending').length
  )

  /** Number of completed jobs in current batch */
  const completedCount = computed(() =>
    jobs.value.filter((job) => job.status === 'completed').length
  )

  /** Overall progress (0-100) */
  const overallProgress = computed(() => {
    if (jobs.value.length === 0) return 0
    const total = jobs.value.length
    const completed = completedCount.value
    const current = currentJob.value?.progress ?? 0
    return Math.round(((completed + current / 100) / total) * 100)
  })

  /** Whether cancellation is possible */
  const canCancel = computed(() => isProcessing.value && abortController.value !== null)

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Start processing a batch of images
   * @returns AbortSignal for cancellation
   */
  function startBatch(items: Array<{ id: string; name: string }>): AbortSignal {
    // Create jobs
    jobs.value = items.map((item) => ({
      id: item.id,
      name: item.name,
      status: 'pending',
      progress: 0,
      stage: 'Queued',
    }))

    // Create abort controller
    abortController.value = new AbortController()
    status.value = 'processing'

    return abortController.value.signal
  }

  /**
   * Update progress for a specific job
   */
  function updateJobProgress(id: string, progress: number, stage: string) {
    const job = jobs.value.find((j) => j.id === id)
    if (job) {
      if (job.status === 'pending') {
        job.status = 'processing'
        job.startedAt = Date.now()
      }
      job.progress = progress
      job.stage = stage
    }
  }

  /**
   * Mark a job as completed
   */
  function completeJob(id: string) {
    const job = jobs.value.find((j) => j.id === id)
    if (job) {
      job.status = 'completed'
      job.progress = 100
      job.stage = 'Done'
      job.completedAt = Date.now()

      // Add to history
      history.value.unshift({
        id: job.id,
        name: job.name,
        status: 'completed',
        duration: job.completedAt - (job.startedAt ?? job.completedAt),
        timestamp: job.completedAt,
      })
    }
  }

  /**
   * Mark a job as failed
   */
  function failJob(id: string, error: string) {
    const job = jobs.value.find((j) => j.id === id)
    if (job) {
      job.status = 'failed'
      job.stage = 'Failed'
      job.error = error
      job.completedAt = Date.now()

      // Add to history
      history.value.unshift({
        id: job.id,
        name: job.name,
        status: 'failed',
        duration: job.completedAt - (job.startedAt ?? job.completedAt),
        timestamp: job.completedAt,
        error,
      })
    }
  }

  /**
   * Cancel current processing
   */
  function cancel() {
    if (abortController.value) {
      abortController.value.abort()
      status.value = 'cancelled'

      // Mark all pending/processing jobs as cancelled
      for (const job of jobs.value) {
        if (job.status === 'pending' || job.status === 'processing') {
          job.status = 'cancelled'
          job.stage = 'Cancelled'
          job.completedAt = Date.now()

          history.value.unshift({
            id: job.id,
            name: job.name,
            status: 'cancelled',
            duration: job.completedAt - (job.startedAt ?? job.completedAt),
            timestamp: job.completedAt,
          })
        }
      }
    }
  }

  /**
   * Finish processing (cleanup)
   */
  function finish() {
    abortController.value = null
    status.value = 'idle'
  }

  /**
   * Reset state completely
   */
  function reset() {
    jobs.value = []
    abortController.value = null
    status.value = 'idle'
  }

  /**
   * Clear history
   */
  function clearHistory() {
    history.value = []
  }

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    // State
    jobs,
    history,
    status,

    // Computed
    isProcessing,
    currentJob,
    pendingCount,
    completedCount,
    overallProgress,
    canCancel,

    // Actions
    startBatch,
    updateJobProgress,
    completeJob,
    failJob,
    cancel,
    finish,
    reset,
    clearHistory,
  }
})

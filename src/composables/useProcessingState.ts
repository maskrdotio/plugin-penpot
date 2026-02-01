/**
 * Processing State Composable
 *
 * Manages UI state for processing operations.
 * Pure state management - processing logic moved to services.
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { ProcessingState } from '@/types'

// =============================================================================
// Types
// =============================================================================

export interface ProcessingStateComposable {
  /** Current processing state */
  state: Ref<ProcessingState>
  /** Whether currently processing */
  isProcessing: ComputedRef<boolean>
  /** Current progress percentage (0-100) */
  progress: ComputedRef<number>
  /** Current status message */
  status: ComputedRef<string>
  /** Update progress */
  setProgress: (current: number, total: number, status: string) => void
  /** Start processing */
  startProcessing: (totalItems: number) => void
  /** Mark processing as complete */
  finishProcessing: () => void
  /** Reset all state */
  resetProcessing: () => void
}

// =============================================================================
// Composable
// =============================================================================

/**
 * Create a processing state composable
 *
 * @example
 * ```ts
 * const { state, setProgress, startProcessing, finishProcessing } = useProcessingState()
 *
 * startProcessing(images.length)
 *
 * for (let i = 0; i < images.length; i++) {
 *   setProgress(i, images.length, `Processing ${images[i].name}...`)
 *   // ... process
 * }
 *
 * finishProcessing()
 * ```
 */
export function useProcessingState(): ProcessingStateComposable {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const state = ref<ProcessingState>({
    isProcessing: false,
    progress: 0,
    status: '',
    currentItem: 0,
    totalItems: 0,
  })

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const isProcessing = computed(() => state.value.isProcessing)
  const progress = computed(() => state.value.progress)
  const status = computed(() => state.value.status)

  // ---------------------------------------------------------------------------
  // Methods
  // ---------------------------------------------------------------------------

  function setProgress(current: number, total: number, statusMessage: string) {
    state.value.currentItem = current
    state.value.totalItems = total
    state.value.progress = total > 0 ? Math.round((current / total) * 100) : 0
    state.value.status = statusMessage
  }

  function startProcessing(totalItems: number) {
    state.value = {
      isProcessing: true,
      progress: 0,
      status: 'Starting...',
      currentItem: 0,
      totalItems,
    }
  }

  function finishProcessing() {
    state.value.isProcessing = false
    state.value.progress = 100
    state.value.status = 'Complete'
  }

  function resetProcessing() {
    state.value = {
      isProcessing: false,
      progress: 0,
      status: '',
      currentItem: 0,
      totalItems: 0,
    }
  }

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    state,
    isProcessing,
    progress,
    status,
    setProgress,
    startProcessing,
    finishProcessing,
    resetProcessing,
  }
}

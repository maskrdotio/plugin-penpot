/**
 * Processing Controller Composable
 *
 * Manages AbortController lifecycle for cancellable operations.
 * Provides a clean interface for starting, cancelling, and
 * tracking processing state.
 */

import { ref, readonly, onUnmounted, type Ref } from 'vue'

// =============================================================================
// Types
// =============================================================================

export interface ProcessingController {
  /** Whether processing is currently active */
  isProcessing: Readonly<Ref<boolean>>
  /**
   * Start a new processing operation
   * Automatically cancels any existing operation
   * @returns AbortSignal to pass to async operations
   */
  startProcessing: () => AbortSignal
  /**
   * Cancel the current processing operation
   * Safe to call even if not processing
   */
  cancel: () => void
  /**
   * Mark processing as complete
   * Should be called when processing finishes successfully
   */
  finish: () => void
  /**
   * Check if the current operation has been cancelled
   */
  isCancelled: () => boolean
}

// =============================================================================
// Composable
// =============================================================================

/**
 * Create a processing controller
 *
 * Automatically cleans up on component unmount.
 *
 * @example
 * ```ts
 * const { isProcessing, startProcessing, cancel, finish } = useProcessingController()
 *
 * async function handleProcess() {
 *   const signal = startProcessing()
 *
 *   try {
 *     for await (const result of service.process(items, { signal })) {
 *       // Handle each result
 *     }
 *     finish()
 *   } catch (error) {
 *     if (error.name === 'AbortError') {
 *       // User cancelled
 *     }
 *   }
 * }
 *
 * // In template: <button @click="cancel" v-if="isProcessing">Cancel</button>
 * ```
 */
export function useProcessingController(): ProcessingController {
  const isProcessing = ref(false)
  let abortController: AbortController | null = null

  function startProcessing(): AbortSignal {
    // Cancel any existing operation
    cancel()

    // Create new controller
    abortController = new AbortController()
    isProcessing.value = true

    return abortController.signal
  }

  function cancel() {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    isProcessing.value = false
  }

  function finish() {
    abortController = null
    isProcessing.value = false
  }

  function isCancelled(): boolean {
    return abortController?.signal.aborted ?? false
  }

  // Cleanup on unmount
  onUnmounted(() => {
    cancel()
  })

  return {
    isProcessing: readonly(isProcessing),
    startProcessing,
    cancel,
    finish,
    isCancelled,
  }
}

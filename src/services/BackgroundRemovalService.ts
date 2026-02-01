/**
 * Background Removal Service - Orchestrates the full background removal workflow
 *
 * Features:
 * - Async generator pattern for streaming results
 * - Progress reporting via callback
 * - Cancellation support via AbortSignal
 * - Composable service dependencies
 */

import type { ApiService } from './ApiService'
import type { ImageProcessingService } from './ImageProcessingService'
import type { PenpotImageInfo } from '@/types/messages'

// =============================================================================
// Types
// =============================================================================

/** Progress information during processing */
export interface ProcessingProgress {
  /** Current item index (0-based) */
  current: number
  /** Total number of items */
  total: number
  /** Human-readable status message */
  status: string
  /** ID of the image being processed */
  imageId: string
  /** Processing stage */
  stage: 'exporting' | 'processing' | 'downloading' | 'applying' | 'complete'
}

/** Result of processing a single image */
export interface ProcessingResult {
  /** Original image ID from Penpot */
  imageId: string
  /** Name for the new image */
  name: string
  /** Processed image data with background removed */
  resultData: Uint8Array
}

/** Function to export an image from Penpot */
export type ExportImageFn = (id: string) => Promise<Uint8Array>

/** Function to report progress updates */
export type OnProgressFn = (progress: ProcessingProgress) => void

// =============================================================================
// Service Interface
// =============================================================================

export interface BackgroundRemovalService {
  /**
   * Process multiple images for background removal
   *
   * Uses an async generator to yield results as they complete,
   * allowing the caller to handle each result immediately.
   *
   * @param images - Array of images to process
   * @param exportImage - Function to export image data from Penpot
   * @param onProgress - Callback for progress updates
   * @param signal - Optional AbortSignal for cancellation
   * @yields ProcessingResult for each completed image
   */
  process(
    images: PenpotImageInfo[],
    exportImage: ExportImageFn,
    onProgress: OnProgressFn,
    signal?: AbortSignal
  ): AsyncGenerator<ProcessingResult, void, unknown>
}

// =============================================================================
// Service Factory
// =============================================================================

/**
 * Create a background removal service instance
 *
 * @param api - API service for backend communication
 * @param imageProcessing - Image processing service for canvas operations
 */
export function createBackgroundRemovalService(
  api: ApiService,
  imageProcessing: ImageProcessingService
): BackgroundRemovalService {
  return {
    async *process(images, exportImage, onProgress, signal) {
      const total = images.length

      for (let i = 0; i < images.length; i++) {
        // Check for cancellation before each iteration
        if (signal?.aborted) {
          throw new DOMException('Processing cancelled', 'AbortError')
        }

        const image = images[i]

        // Stage 1: Export from Penpot
        onProgress({
          current: i,
          total,
          status: `Exporting ${image.name}...`,
          imageId: image.id,
          stage: 'exporting',
        })

        const imageData = await exportImage(image.id)

        // Check cancellation after export
        if (signal?.aborted) {
          throw new DOMException('Processing cancelled', 'AbortError')
        }

        // Stage 2: Send to API
        onProgress({
          current: i,
          total,
          status: `Processing ${image.name}...`,
          imageId: image.id,
          stage: 'processing',
        })

        const result = await api.removeBackground(
          imageData,
          `${image.name}.png`,
          signal
        )

        // Check cancellation after API call
        if (signal?.aborted) {
          throw new DOMException('Processing cancelled', 'AbortError')
        }

        // Stage 3: Download mask
        onProgress({
          current: i,
          total,
          status: `Downloading mask...`,
          imageId: image.id,
          stage: 'downloading',
        })

        const maskData = await api.downloadMask(result.result.output_url, signal)

        // Check cancellation after download
        if (signal?.aborted) {
          throw new DOMException('Processing cancelled', 'AbortError')
        }

        // Stage 4: Apply mask
        onProgress({
          current: i,
          total,
          status: `Applying mask...`,
          imageId: image.id,
          stage: 'applying',
        })

        const resultData = await imageProcessing.applyMaskToImage(imageData, maskData)

        // Stage 5: Complete
        onProgress({
          current: i + 1,
          total,
          status: `Completed ${image.name}`,
          imageId: image.id,
          stage: 'complete',
        })

        // Yield the result for immediate handling
        yield {
          imageId: image.id,
          name: `${image.name} - No BG`,
          resultData,
        }
      }
    },
  }
}

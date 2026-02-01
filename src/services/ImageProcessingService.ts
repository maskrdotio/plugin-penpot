/**
 * Image Processing Service - Handles canvas-based image operations
 *
 * Features:
 * - Mask application with alpha channel manipulation
 * - Safe canvas context handling
 * - Proper memory management (URL revocation)
 */

// =============================================================================
// Service Interface
// =============================================================================

export interface ImageProcessingService {
  /**
   * Apply a mask to an original image
   *
   * @param originalData - The original image data
   * @param maskData - The mask image data (grayscale: white=keep, black=remove)
   * @returns The processed image with alpha channel applied
   */
  applyMaskToImage(originalData: Uint8Array, maskData: Uint8Array): Promise<Uint8Array>

  /**
   * Load image data into an HTMLImageElement
   *
   * @param data - The image data as Uint8Array
   * @returns Promise resolving to loaded image element
   */
  loadImage(data: Uint8Array): Promise<HTMLImageElement>
}

// =============================================================================
// Service Factory
// =============================================================================

/**
 * Create an image processing service instance
 */
export function createImageProcessingService(): ImageProcessingService {
  /**
   * Load Uint8Array data into an HTMLImageElement
   * Properly manages blob URL lifecycle
   */
  function loadImage(data: Uint8Array): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      // Type assertion needed due to TS strict mode with ArrayBufferLike
      const blob = new Blob([data as BlobPart], { type: 'image/png' })
      const url = URL.createObjectURL(blob)
      const img = new Image()

      const cleanup = () => {
        URL.revokeObjectURL(url)
      }

      img.onload = () => {
        cleanup()
        resolve(img)
      }

      img.onerror = () => {
        cleanup()
        reject(new ImageProcessingError('Failed to load image'))
      }

      img.src = url
    })
  }

  /**
   * Create a canvas with 2D context, throwing if unavailable
   */
  function createCanvas(width: number, height: number): {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
  } {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new ImageProcessingError(
        'Failed to get canvas 2D context. This may occur in headless environments.'
      )
    }

    return { canvas, ctx }
  }

  /**
   * Convert canvas to PNG Uint8Array
   */
  async function canvasToUint8Array(canvas: HTMLCanvasElement): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new ImageProcessingError('Failed to convert canvas to blob'))
            return
          }

          blob
            .arrayBuffer()
            .then((buffer) => resolve(new Uint8Array(buffer)))
            .catch(() => reject(new ImageProcessingError('Failed to read blob data')))
        },
        'image/png'
      )
    })
  }

  return {
    loadImage,

    async applyMaskToImage(originalData, maskData) {
      // Load both images in parallel
      const [originalImg, maskImg] = await Promise.all([
        loadImage(originalData),
        loadImage(maskData),
      ])

      // Create canvas with original image dimensions
      const { canvas, ctx } = createCanvas(originalImg.width, originalImg.height)

      // Draw original image
      ctx.drawImage(originalImg, 0, 0)

      // Get original image pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const pixels = imageData.data

      // Create separate canvas for mask (may need scaling)
      const { ctx: maskCtx } = createCanvas(
        originalImg.width,
        originalImg.height
      )

      // Draw mask scaled to original dimensions
      maskCtx.drawImage(maskImg, 0, 0, originalImg.width, originalImg.height)

      // Get mask pixel data
      const maskImageData = maskCtx.getImageData(0, 0, canvas.width, canvas.height)
      const maskPixels = maskImageData.data

      // Apply mask as alpha channel
      // Mask is grayscale: white (255) = keep, black (0) = remove
      // We use the red channel since R=G=B for grayscale
      for (let i = 0; i < pixels.length; i += 4) {
        pixels[i + 3] = maskPixels[i] // Set alpha from mask red channel
      }

      // Put modified data back
      ctx.putImageData(imageData, 0, 0)

      // Convert to PNG bytes
      return canvasToUint8Array(canvas)
    },
  }
}

// =============================================================================
// Error Types
// =============================================================================

/** Custom error class for image processing errors */
export class ImageProcessingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageProcessingError'
    Object.setPrototypeOf(this, ImageProcessingError.prototype)
  }
}

/**
 * Services barrel export
 */

export { createApiService, ApiError, type ApiService } from './ApiService'
export {
  createImageProcessingService,
  ImageProcessingError,
  type ImageProcessingService,
} from './ImageProcessingService'
export {
  createBackgroundRemovalService,
  type BackgroundRemovalService,
  type ProcessingProgress,
  type ProcessingResult,
  type ExportImageFn,
  type OnProgressFn,
} from './BackgroundRemovalService'
export {
  createLogger,
  logger,
  apiLogger,
  authLogger,
  processingLogger,
  penpotLogger,
  type Logger,
  type LogLevel,
  type LogEntry,
} from './LoggerService'

<script setup lang="ts">
/**
 * Error Boundary Component
 *
 * Catches errors in child component tree and displays a fallback UI.
 * Provides retry functionality to recover from errors.
 */

import { ref, onErrorCaptured } from 'vue'
import { logger } from '@/services/LoggerService'
import AppButton from './AppButton.vue'

// =============================================================================
// Props & Emits
// =============================================================================

interface Props {
  /** Custom title for error state */
  title?: string
  /** Whether to show error details */
  showDetails?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Something went wrong',
  showDetails: false,
})

const emit = defineEmits<{
  error: [error: Error, info: string]
}>()

// =============================================================================
// State
// =============================================================================

const error = ref<Error | null>(null)
const errorInfo = ref<string>('')

// =============================================================================
// Error Handling
// =============================================================================

onErrorCaptured((err, instance, info) => {
  // Capture the error
  error.value = err instanceof Error ? err : new Error(String(err))
  errorInfo.value = info

  // Log the error
  logger.error('ErrorBoundary caught error', error.value, {
    component: instance?.$options?.name ?? 'Unknown',
    info,
  })

  // Emit for parent handling
  emit('error', error.value, info)

  // Prevent error from propagating
  return false
})

// =============================================================================
// Actions
// =============================================================================

function retry() {
  error.value = null
  errorInfo.value = ''
}
</script>

<template>
  <slot v-if="!error" />

  <div v-else class="error-boundary">
    <div class="error-boundary__icon">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </div>

    <h2 class="error-boundary__title">{{ title }}</h2>

    <p class="error-boundary__message">
      {{ error.message }}
    </p>

    <div v-if="showDetails && errorInfo" class="error-boundary__details">
      <details>
        <summary>Error Details</summary>
        <pre>{{ errorInfo }}</pre>
        <pre>{{ error.stack }}</pre>
      </details>
    </div>

    <div class="error-boundary__actions">
      <AppButton @click="retry">
        Try Again
      </AppButton>
    </div>
  </div>
</template>

<style scoped>
.error-boundary {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  min-height: 200px;
}

.error-boundary__icon {
  color: var(--color-error, #e53935);
  margin-bottom: 1rem;
  opacity: 0.8;
}

.error-boundary__title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--color-foreground);
}

.error-boundary__message {
  font-size: 0.875rem;
  color: var(--color-foreground-secondary);
  margin: 0 0 1.5rem;
  max-width: 300px;
}

.error-boundary__details {
  width: 100%;
  max-width: 400px;
  margin-bottom: 1.5rem;
  text-align: left;
}

.error-boundary__details details {
  background: var(--color-background-secondary);
  border-radius: 4px;
  padding: 0.5rem;
}

.error-boundary__details summary {
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--color-foreground-secondary);
}

.error-boundary__details pre {
  font-size: 0.7rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0.5rem 0 0;
  padding: 0.5rem;
  background: var(--color-background);
  border-radius: 2px;
}

.error-boundary__actions {
  display: flex;
  gap: 0.5rem;
}
</style>

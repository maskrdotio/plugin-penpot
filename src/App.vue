<script setup lang="ts">
/**
 * Root Application Component
 *
 * Orchestrates the plugin UI with clean separation of concerns:
 * - State management via Pinia stores
 * - Business logic delegated to services
 * - Cancellation support via AbortController
 * - Centralized error handling
 * - Error boundary for graceful failure
 */

import { ref, computed, onMounted, watch } from 'vue'
import type { ToolId } from '@/types'
import { config } from '@/config'

// Composables
import { usePenpot } from '@/composables/usePenpot'
import { provideAuth } from '@/composables/context/authContext'
import { provideServices } from '@/composables/context/servicesContext'
import { useErrorHandler } from '@/composables/useErrorHandler'

// Store
import { useProcessingStore } from '@/stores'

// Services
import {
  createApiService,
  createImageProcessingService,
  createBackgroundRemovalService,
  logger,
} from '@/services'

// Components
import ErrorBoundary from '@/components/ErrorBoundary.vue'

// Views
import LandingView from '@/views/LandingView.vue'
import LoginView from '@/views/LoginView.vue'
import MainView from '@/views/MainView.vue'
import ProcessingView from '@/views/ProcessingView.vue'

// =============================================================================
// Types
// =============================================================================

type View = 'login' | 'main' | 'processing'

// =============================================================================
// Environment Detection
// =============================================================================

// Detect if running inside Penpot (iframe) or standalone (direct browser visit)
const isInPenpot = window.parent !== window

// =============================================================================
// State & Composables
// =============================================================================

const currentView = ref<View>('login')

// Initialize composables and stores
const penpot = usePenpot()
const auth = provideAuth()
const processingStore = useProcessingStore()
const errorHandler = useErrorHandler({ autoClearMs: 5000 })

// Create and provide services
const api = createApiService(() => auth.getToken())
const imageProcessing = createImageProcessingService()
const backgroundRemoval = createBackgroundRemovalService(api, imageProcessing)

provideServices({ api, imageProcessing, backgroundRemoval })

// Computed state for ProcessingView
const processingState = computed(() => ({
  isProcessing: processingStore.isProcessing,
  progress: processingStore.overallProgress,
  status: processingStore.currentJob?.stage ?? 'Preparing...',
  currentItem: processingStore.completedCount + 1,
  totalItems: processingStore.jobs.length,
}))

// =============================================================================
// Lifecycle
// =============================================================================

onMounted(async () => {
  const hasToken = await auth.loadSavedToken()
  if (hasToken) {
    currentView.value = 'main'
    penpot.requestSelection()
  }
})

// Watch for theme changes
watch(
  () => penpot.theme.value,
  (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
  },
  { immediate: true }
)

// =============================================================================
// Auth Handlers
// =============================================================================

async function handleLogin() {
  errorHandler.clearError()
  try {
    await auth.startLogin()
    currentView.value = 'main'
    penpot.requestSelection()
  } catch (err) {
    errorHandler.handleError(err)
  }
}

function handleCancelLogin() {
  auth.cancelLogin()
}

function handleSignOut() {
  auth.logout()
  currentView.value = 'login'
  errorHandler.clearError()
}

// =============================================================================
// Processing Handlers
// =============================================================================

async function handleProcess(toolId: ToolId) {
  const images = penpot.selection.value

  switch (toolId) {
    case 'remove-bg':
      await processRemoveBackground(images)
      break
    case 'upscale':
    case 'inpaint':
    case 'segment':
    case 'icon-gen':
      errorHandler.setError('This feature is coming soon!')
      break
  }
}

/**
 * Process images for background removal
 *
 * Uses async generator pattern from BackgroundRemovalService
 * with proper cancellation and error handling via Pinia store.
 */
async function processRemoveBackground(images: typeof penpot.selection.value) {
  if (images.length === 0) return

  currentView.value = 'processing'
  errorHandler.clearError()

  // Start batch processing with Pinia store
  const signal = processingStore.startBatch(
    images.map((img) => ({ id: img.id, name: img.name }))
  )

  logger.info('Processing started', { count: images.length })

  try {
    // Process images using async generator
    for await (const result of backgroundRemoval.process(
      images,
      penpot.exportImage,
      (progress) => {
        processingStore.updateJobProgress(
          progress.imageId,
          Math.round((progress.current / progress.total) * 100),
          progress.status
        )
      },
      signal
    )) {
      // Mark job complete and create new image in Penpot
      processingStore.completeJob(result.imageId)
      penpot.createImageFromData(result.name, result.resultData, result.imageId)
    }

    processingStore.finish()
    await auth.refreshAccountInfo()

    logger.info('Processing completed', {
      completed: processingStore.completedCount,
      total: processingStore.jobs.length,
    })

    // Return to main view after delay
    setTimeout(() => {
      currentView.value = 'main'
      processingStore.reset()
    }, config.processing.completionDelay)
  } catch (err) {
    // Mark current job as failed if there is one
    const currentJob = processingStore.currentJob
    if (currentJob && err instanceof Error) {
      processingStore.failJob(currentJob.id, err.message)
    }

    processingStore.finish()
    currentView.value = 'main'

    logger.error('Processing failed', err instanceof Error ? err : new Error(String(err)))

    // Handle error with lifecycle callbacks
    errorHandler.handleError(err, {
      onAuthError: handleSignOut,
      onCreditsError: () => {
        // Open pricing page so user can upgrade
        window.open(config.externalLinks.pricing, '_blank')
      },
    })
  }
}

function handleCancelProcessing() {
  processingStore.cancel()
  processingStore.finish()
  currentView.value = 'main'
  logger.info('Processing cancelled')
}
</script>

<template>
  <!-- Show landing page when accessed directly (not in Penpot) -->
  <LandingView v-if="!isInPenpot" />

  <!-- Plugin UI when running inside Penpot -->
  <ErrorBoundary v-else @error="(err) => logger.error('UI Error', err)">
    <div class="app" :class="`theme-${penpot.theme.value}`">
      <LoginView
        v-if="currentView === 'login'"
        :is-loading="auth.isLoading.value"
        :error="errorHandler.error.value.message || auth.error.value"
        @login="handleLogin"
        @cancel="handleCancelLogin"
      />

      <MainView
        v-else-if="currentView === 'main'"
        :user="auth.user.value"
        :selection="penpot.selection.value"
        :error="errorHandler.error.value.message"
        @sign-out="handleSignOut"
        @process="handleProcess"
      />

      <ProcessingView
        v-else-if="currentView === 'processing'"
        :state="processingState"
        :can-cancel="processingStore.canCancel"
        @cancel="handleCancelProcessing"
      />
    </div>
  </ErrorBoundary>
</template>

<style>
:root {
  --color-accent: #7b61ff;
  --color-accent-hover: #6b51ef;
  --color-background: #ffffff;
  --color-background-secondary: #f5f5f5;
  --color-background-tertiary: #e8e8e8;
  --color-foreground: #1e1e1e;
  --color-foreground-secondary: #666666;
  --color-foreground-tertiary: #999999;
  --color-border: #e0e0e0;
  --color-error: #e53935;
}

[data-theme='dark'] {
  --color-background: #1e1e1e;
  --color-background-secondary: #2d2d2d;
  --color-background-tertiary: #3d3d3d;
  --color-foreground: #ffffff;
  --color-foreground-secondary: #b3b3b3;
  --color-foreground-tertiary: #808080;
  --color-border: #404040;
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body,
#app {
  margin: 0 !important;
  padding: 0 !important;
  height: 100%;
  overflow: hidden;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  background: var(--color-background);
  color: var(--color-foreground);
}

.app {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>

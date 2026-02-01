<script setup lang="ts">
import type { ProcessingState } from '@/types'
import Spinner from '@/components/Spinner.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import AppButton from '@/components/AppButton.vue'

defineProps<{
  state: ProcessingState
  /** Whether cancellation is supported */
  canCancel?: boolean
}>()

defineEmits<{
  cancel: []
}>()
</script>

<template>
  <div class="processing">
    <div class="processing__content">
      <Spinner size="lg" />
      <h2 class="processing__title">Processing</h2>
      <p class="processing__status">{{ state.status }}</p>

      <div class="processing__progress">
        <ProgressBar :progress="state.progress" />
      </div>

      <p v-if="state.totalItems > 1" class="processing__count">
        {{ state.currentItem }} of {{ state.totalItems }}
      </p>

      <div v-if="canCancel" class="processing__actions">
        <AppButton variant="text" @click="$emit('cancel')">
          Cancel
        </AppButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.processing {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 2rem;
}

.processing__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: 280px;
}

.processing__title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1.5rem 0 0.5rem;
  color: var(--color-foreground, #1e1e1e);
}

.processing__status {
  font-size: 0.875rem;
  color: var(--color-foreground-secondary, #666);
  margin: 0 0 1.5rem;
}

.processing__progress {
  width: 100%;
}

.processing__count {
  font-size: 0.75rem;
  color: var(--color-foreground-secondary, #666);
  margin: 1rem 0 0;
}

.processing__actions {
  margin-top: 1.5rem;
}
</style>

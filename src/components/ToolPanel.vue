<script setup lang="ts">
import { computed } from 'vue'
import type { Tool } from '@/types'
import type { PenpotImageInfo } from '@/types/messages'
import AppButton from './AppButton.vue'
import { IconImage } from './icons'

const props = defineProps<{
  tool: Tool
  selection: PenpotImageInfo[]
}>()

defineEmits<{
  process: []
}>()

const hasSelection = computed(() => props.selection.length > 0)

const selectionText = computed(() => {
  const count = props.selection.length
  if (count === 0) return 'Select an image to process'
  if (count === 1) return '1 image selected'
  return `${count} images selected`
})

const canProcess = computed(() => {
  if (props.tool.comingSoon) return false
  if (props.tool.requiresSelection) return hasSelection.value
  return true
})
</script>

<template>
  <div class="tool-panel">
    <div class="tool-panel__header">
      <h2 class="tool-panel__title">{{ tool.name }}</h2>
      <p class="tool-panel__description">{{ tool.description }}</p>
    </div>

    <div class="tool-panel__content">
      <!-- Tool-specific options will go here in the future -->
      <slot :name="tool.id" />
    </div>

    <div class="tool-panel__actions">
      <AppButton
        full-width
        :disabled="!canProcess"
        @click="$emit('process')"
      >
        {{ tool.name }}
      </AppButton>

      <p v-if="tool.requiresSelection" class="tool-panel__selection">
        {{ selectionText }}
      </p>
    </div>

    <div v-if="!hasSelection && tool.requiresSelection" class="tool-panel__hint">
      <IconImage :size="48" />
      <p>Select one or more images in your design</p>
    </div>
  </div>
</template>

<style scoped>
.tool-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 1rem;
}

.tool-panel__header {
  margin-bottom: 1rem;
}

.tool-panel__title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
  color: var(--color-foreground, #1e1e1e);
}

.tool-panel__description {
  font-size: 0.75rem;
  color: var(--color-foreground-secondary, #666);
  margin: 0;
}

.tool-panel__content {
  flex: 1;
  min-height: 0;
}

.tool-panel__actions {
  margin-top: auto;
}

.tool-panel__selection {
  text-align: center;
  font-size: 0.875rem;
  color: var(--color-foreground-secondary, #666);
  margin: 0.75rem 0 0;
}

.tool-panel__hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem;
  color: var(--color-foreground-tertiary, #999);
  text-align: center;
}

.tool-panel__hint p {
  margin: 0;
  font-size: 0.875rem;
}
</style>

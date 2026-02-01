<script setup lang="ts">
import { ref, computed } from 'vue'
import type { User, ToolId } from '@/types'
import type { PenpotImageInfo } from '@/types/messages'
import { tools, getToolById } from '@/config/tools'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import ToolTabs from '@/components/ToolTabs.vue'
import ToolPanel from '@/components/ToolPanel.vue'

defineProps<{
  user: User | null
  selection: PenpotImageInfo[]
  error?: string | null
}>()

const emit = defineEmits<{
  signOut: []
  process: [toolId: ToolId]
}>()

const activeToolId = ref<ToolId>('remove-bg')

const activeTool = computed(() => getToolById(activeToolId.value)!)

function handleProcess() {
  emit('process', activeToolId.value)
}
</script>

<template>
  <div class="main">
    <AppHeader @sign-out="$emit('signOut')" />

    <ToolTabs
      :tools="tools"
      :active-tool-id="activeToolId"
      @select="activeToolId = $event"
    />

    <ToolPanel
      :tool="activeTool"
      :selection="selection"
      @process="handleProcess"
    />

    <!-- Error toast -->
    <div v-if="error" class="main__error">
      {{ error }}
    </div>

    <AppFooter :user="user" />
  </div>
</template>

<style scoped>
.main {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.main__error {
  position: absolute;
  bottom: 5rem;
  left: 1rem;
  right: 1rem;
  padding: 0.75rem 1rem;
  background: var(--color-error, #e53935);
  color: white;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  text-align: center;
  animation: slideUp 0.2s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(0.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

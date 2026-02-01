<script setup lang="ts">
import type { Tool, ToolId } from '@/types'
import { toolIcons, type ToolIconName } from './icons'

defineProps<{
  tools: Tool[]
  activeToolId: ToolId
}>()

defineEmits<{
  select: [toolId: ToolId]
}>()

/**
 * Get icon component for a tool
 * Returns undefined if icon name not found (graceful fallback)
 */
function getToolIcon(iconName: string) {
  return toolIcons[iconName as ToolIconName]
}
</script>

<template>
  <div class="tool-tabs">
    <button
      v-for="tool in tools"
      :key="tool.id"
      class="tool-tab"
      :class="{
        'tool-tab--active': tool.id === activeToolId,
        'tool-tab--coming-soon': tool.comingSoon,
      }"
      :disabled="tool.comingSoon"
      :title="tool.comingSoon ? `${tool.name} (Coming Soon)` : tool.name"
      @click="$emit('select', tool.id)"
    >
      <span class="tool-tab__icon">
        <component
          :is="getToolIcon(tool.icon)"
          v-if="getToolIcon(tool.icon)"
          :size="20"
        />
      </span>
      <span class="tool-tab__label">{{ tool.shortName }}</span>
      <span v-if="tool.comingSoon" class="tool-tab__badge">Soon</span>
    </button>
  </div>
</template>

<style scoped>
.tool-tabs {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  border-bottom: 1px solid var(--color-border, #e0e0e0);
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tool-tabs::-webkit-scrollbar {
  display: none;
}

.tool-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  min-width: 3.5rem;
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--color-foreground-secondary, #666);
  font-size: 0.625rem;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.tool-tab:hover:not(:disabled) {
  background: var(--color-background-secondary, #f5f5f5);
  color: var(--color-foreground, #1e1e1e);
}

.tool-tab--active {
  background: var(--color-accent, #7b61ff) !important;
  color: white !important;
}

.tool-tab--coming-soon {
  opacity: 0.5;
  cursor: not-allowed;
}

.tool-tab__icon {
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-tab__label {
  white-space: nowrap;
}

.tool-tab__badge {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 0.5rem;
  padding: 0.125rem 0.25rem;
  background: var(--color-foreground-tertiary, #999);
  color: white;
  border-radius: 0.25rem;
  transform: translate(25%, -25%);
}
</style>

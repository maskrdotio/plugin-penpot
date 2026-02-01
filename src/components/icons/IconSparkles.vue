<script setup lang="ts">
/**
 * Sparkles Icon - Used for Icon Generation tool
 */
import IconBase from './IconBase.vue'

withDefaults(
  defineProps<{
    size?: number | string
  }>(),
  {
    size: 24,
  }
)
</script>

<template>
  <IconBase :size="size">
    <path
      d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"
      stroke="currentColor"
      stroke-width="2"
    />
    <path
      d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z"
      stroke="currentColor"
      stroke-width="2"
    />
  </IconBase>
</template>

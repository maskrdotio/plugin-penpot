<script setup lang="ts">
/**
 * Image Icon - Used for image selection hints
 */
import IconBase from './IconBase.vue'

withDefaults(
  defineProps<{
    size?: number | string
  }>(),
  {
    size: 48,
  }
)
</script>

<template>
  <IconBase :size="size">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5" />
    <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" stroke-width="1.5" />
    <path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="1.5" />
  </IconBase>
</template>

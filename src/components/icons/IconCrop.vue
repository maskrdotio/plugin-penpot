<script setup lang="ts">
/**
 * Crop Icon - Used for Remove Background tool
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
    <path d="M6 2v14a2 2 0 0 0 2 2h14" stroke="currentColor" stroke-width="2" />
    <path d="M18 22V8a2 2 0 0 0-2-2H2" stroke="currentColor" stroke-width="2" />
  </IconBase>
</template>

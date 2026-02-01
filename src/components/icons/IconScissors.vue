<script setup lang="ts">
/**
 * Scissors Icon - Used for Segment tool
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
    <circle cx="6" cy="6" r="3" stroke="currentColor" stroke-width="2" />
    <circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="2" />
    <path
      d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"
      stroke="currentColor"
      stroke-width="2"
    />
  </IconBase>
</template>

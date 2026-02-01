<script setup lang="ts">
/**
 * Eraser Icon - Used for Inpaint tool
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
    <path d="M20 20H7L3 16l9-9 8 8-4 4" stroke="currentColor" stroke-width="2" />
    <path d="M6 11l5 5" stroke="currentColor" stroke-width="2" />
  </IconBase>
</template>

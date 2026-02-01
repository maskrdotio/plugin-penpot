<script setup lang="ts">
/**
 * Maskr.io Logo Icon
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
  <IconBase :size="size" viewBox="0 0 32 32">
    <!-- Blue background -->
    <rect width="32" height="32" rx="8" fill="#3B82F6" />
    <!-- White rounded rectangle -->
    <path
      d="M8 12C8 9.79086 9.79086 8 12 8H20C22.2091 8 24 9.79086 24 12V20C24 22.2091 22.2091 24 20 24H12C9.79086 24 8 22.2091 8 20V12Z"
      fill="white"
      fill-opacity="0.9"
    />
    <!-- Blue circle in center -->
    <circle cx="16" cy="16" r="4" fill="#3B82F6" />
  </IconBase>
</template>

<script setup lang="ts">
/**
 * Base Icon Component
 *
 * Provides consistent sizing and styling for all icons.
 * Child icon components render their SVG content via the default slot.
 */

withDefaults(
  defineProps<{
    /** Icon size in pixels */
    size?: number | string
    /** Custom viewBox (defaults to 24x24) */
    viewBox?: string
    /** Stroke width for stroke-based icons */
    strokeWidth?: number | string
  }>(),
  {
    size: 24,
    viewBox: '0 0 24 24',
    strokeWidth: 2,
  }
)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    :viewBox="viewBox"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="icon"
  >
    <slot :stroke-width="strokeWidth" />
  </svg>
</template>

<style scoped>
.icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>

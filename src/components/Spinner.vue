<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg'
}>()
</script>

<template>
  <div
    class="spinner"
    :class="{
      'spinner--sm': size === 'sm',
      'spinner--md': size === 'md' || !size,
      'spinner--lg': size === 'lg',
    }"
  />
</template>

<style scoped>
.spinner {
  border-radius: 50%;
  border: 2px solid var(--color-background-secondary, #f0f0f0);
  border-top-color: var(--color-accent, #7b61ff);
  animation: spin 0.8s linear infinite;
}

.spinner--sm {
  width: 1rem;
  height: 1rem;
}

.spinner--md {
  width: 1.5rem;
  height: 1.5rem;
}

.spinner--lg {
  width: 2.5rem;
  height: 2.5rem;
  border-width: 3px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'text'
  disabled?: boolean
  fullWidth?: boolean
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    class="btn"
    :class="{
      'btn--primary': variant === 'primary' || !variant,
      'btn--secondary': variant === 'secondary',
      'btn--text': variant === 'text',
      'btn--full-width': fullWidth,
    }"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--primary {
  background: var(--color-accent, #7b61ff);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background: var(--color-accent-hover, #6b51ef);
}

.btn--secondary {
  background: var(--color-background-secondary, #f0f0f0);
  color: var(--color-foreground, #1e1e1e);
}

.btn--secondary:hover:not(:disabled) {
  background: var(--color-background-tertiary, #e0e0e0);
}

.btn--text {
  background: transparent;
  color: var(--color-accent, #7b61ff);
  padding: 0.5rem;
}

.btn--text:hover:not(:disabled) {
  background: var(--color-background-secondary, #f0f0f0);
}

.btn--full-width {
  width: 100%;
}
</style>

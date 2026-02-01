<script setup lang="ts">
defineProps<{
  progress: number
}>()
</script>

<template>
  <div class="progress">
    <div class="progress__bar">
      <div
        class="progress__fill"
        :style="{ width: `${Math.min(100, Math.max(0, progress))}%` }"
      />
    </div>
    <span class="progress__text">{{ progress }}%</span>
  </div>
</template>

<style scoped>
.progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.progress__bar {
  flex: 1;
  height: 0.5rem;
  background: var(--color-background-secondary, #f0f0f0);
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress__fill {
  height: 100%;
  background: var(--color-accent, #7b61ff);
  border-radius: 0.25rem;
  transition: width 0.3s ease;
}

.progress__text {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-foreground-secondary, #666);
  min-width: 2.5rem;
  text-align: right;
}
</style>

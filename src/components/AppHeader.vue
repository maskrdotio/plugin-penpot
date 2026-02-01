<script setup lang="ts">
import { IconLogo } from './icons'

defineEmits<{
  signOut: []
}>()
</script>

<template>
  <header class="header">
    <div class="header__logo">
      <IconLogo :size="24" />
      <span class="header__title">Maskr.io</span>
    </div>
    <button class="header__sign-out" @click="$emit('signOut')">
      Sign out
    </button>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border, #e0e0e0);
}

.header__logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-accent, #7b61ff);
}

.header__title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-foreground, #1e1e1e);
}

.header__sign-out {
  background: none;
  border: none;
  color: var(--color-foreground-secondary, #666);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.15s ease;
}

.header__sign-out:hover {
  background: var(--color-background-secondary, #f0f0f0);
  color: var(--color-foreground, #1e1e1e);
}
</style>

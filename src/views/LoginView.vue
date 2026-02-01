<script setup lang="ts">
import AppButton from '@/components/AppButton.vue'
import Spinner from '@/components/Spinner.vue'
import { IconLogo, IconGoogle } from '@/components/icons'

defineProps<{
  isLoading: boolean
  error: string | null
}>()

defineEmits<{
  login: []
  cancel: []
}>()
</script>

<template>
  <div class="login">
    <div class="login__content">
      <div class="login__logo">
        <IconLogo :size="48" />
      </div>
      <h1 class="login__title">Maskr.io</h1>
      <p class="login__subtitle">AI-powered background removal</p>

      <div v-if="isLoading" class="login__loading">
        <Spinner size="lg" />
        <p class="login__loading-text">Waiting for sign in...</p>
        <AppButton variant="text" @click="$emit('cancel')">
          Cancel
        </AppButton>
      </div>

      <div v-else class="login__actions">
        <AppButton full-width @click="$emit('login')">
          <IconGoogle :size="18" />
          Sign in with Google
        </AppButton>

        <p v-if="error" class="login__error">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 2rem;
}

.login__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 280px;
}

.login__logo {
  color: var(--color-accent, #7b61ff);
  margin-bottom: 1rem;
}

.login__title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: var(--color-foreground, #1e1e1e);
}

.login__subtitle {
  font-size: 0.875rem;
  color: var(--color-foreground-secondary, #666);
  margin: 0 0 2rem;
}

.login__actions {
  width: 100%;
}

.login__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.login__loading-text {
  font-size: 0.875rem;
  color: var(--color-foreground-secondary, #666);
  margin: 0;
}

.login__error {
  margin-top: 1rem;
  font-size: 0.75rem;
  color: var(--color-error, #e53935);
}
</style>

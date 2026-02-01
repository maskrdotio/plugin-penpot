<script setup lang="ts">
import type { User } from '@/types'
import { config } from '@/config'

defineProps<{
  user: User | null
}>()

const links = config.externalLinks
</script>

<template>
  <footer class="footer" v-if="user">
    <div class="footer__info">
      <span class="footer__email">{{ user.email }}</span>
      <span class="footer__credits">
        {{ user.credits }} credits
        <span class="footer__plan">{{ user.plan }}</span>
      </span>
    </div>
    <div class="footer__links">
      <a
        :href="links.account"
        target="_blank"
        rel="noopener"
        class="footer__link"
      >
        Account
      </a>
      <span class="footer__divider">|</span>
      <a
        :href="links.pricing"
        target="_blank"
        rel="noopener"
        class="footer__link"
      >
        Upgrade
      </a>
      <span class="footer__divider">|</span>
      <a
        :href="links.help"
        target="_blank"
        rel="noopener"
        class="footer__link"
      >
        Help
      </a>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-border, #e0e0e0);
  font-size: 0.75rem;
}

.footer__info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.footer__email {
  color: var(--color-foreground, #1e1e1e);
  font-weight: 500;
}

.footer__credits {
  color: var(--color-foreground-secondary, #666);
}

.footer__plan {
  text-transform: capitalize;
  margin-left: 0.25rem;
  padding: 0.125rem 0.375rem;
  background: var(--color-background-secondary, #f0f0f0);
  border-radius: 0.25rem;
}

.footer__links {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.footer__link {
  color: var(--color-accent, #7b61ff);
  text-decoration: none;
}

.footer__link:hover {
  text-decoration: underline;
}

.footer__divider {
  color: var(--color-border, #e0e0e0);
}
</style>

<script setup lang="ts">
import { IconLogo } from '@/components/icons'

const manifestUrl = 'https://maskrdotio.github.io/plugin-penpot/manifest.json'

function copyManifestUrl() {
  navigator.clipboard.writeText(manifestUrl)
}
</script>

<template>
  <div class="landing">
    <div class="landing__content">
      <IconLogo :size="48" class="landing__logo" />
      <h1 class="landing__title">Maskr.io for Penpot</h1>
      <p class="landing__description">
        AI-powered image processing tools for Penpot
      </p>

      <div class="landing__install">
        <h2>Install in Penpot</h2>
        <ol class="landing__steps">
          <li>Open Penpot and press <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>P</kbd></li>
          <li>Paste the manifest URL:</li>
        </ol>

        <div class="landing__url-box">
          <code class="landing__url">{{ manifestUrl }}</code>
          <button class="landing__copy-btn" @click="copyManifestUrl">
            Copy
          </button>
        </div>

        <ol class="landing__steps" start="3">
          <li>Click "Install"</li>
        </ol>
      </div>

      <div class="landing__links">
        <a href="https://maskr.io" target="_blank" rel="noopener">maskr.io</a>
        <span class="landing__separator">·</span>
        <a href="https://github.com/maskrdotio/plugin-penpot" target="_blank" rel="noopener">GitHub</a>
        <span class="landing__separator">·</span>
        <a href="https://penpot.app" target="_blank" rel="noopener">Get Penpot</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.landing {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
}

.landing__content {
  max-width: 480px;
  text-align: center;
}

.landing__logo {
  margin-bottom: 1rem;
  color: #7c3aed;
}

.landing__title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
}

.landing__description {
  color: #a0aec0;
  margin: 0 0 2rem;
}

.landing__install {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: left;
  margin-bottom: 2rem;
}

.landing__install h2 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem;
}

.landing__steps {
  margin: 0 0 1rem;
  padding-left: 1.25rem;
  color: #cbd5e0;
}

.landing__steps li {
  margin-bottom: 0.5rem;
}

.landing__steps kbd {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 0.125rem 0.375rem;
  font-family: inherit;
  font-size: 0.875rem;
}

.landing__url-box {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.landing__url {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  padding: 0.625rem 0.75rem;
  font-size: 0.75rem;
  color: #7c3aed;
  word-break: break-all;
}

.landing__copy-btn {
  background: #7c3aed;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.landing__copy-btn:hover {
  background: #6d28d9;
}

.landing__links {
  color: #a0aec0;
  font-size: 0.875rem;
}

.landing__links a {
  color: #7c3aed;
  text-decoration: none;
}

.landing__links a:hover {
  text-decoration: underline;
}

.landing__separator {
  margin: 0 0.5rem;
}
</style>

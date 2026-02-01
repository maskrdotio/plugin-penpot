/**
 * Centralized application configuration
 *
 * All environment-specific values, URLs, timeouts, and magic strings
 * are defined here to ensure consistency and easy maintenance.
 */

const isDev = import.meta.env.DEV

export const config = {
  /** Environment detection */
  isDev,

  /** API service configuration */
  api: {
    /** Base URL for API calls (proxied in dev) */
    baseUrl: isDev ? '/api' : 'https://api.maskr.io',
    /** Default request timeout in milliseconds */
    timeout: 30000,
    /** Number of retry attempts for failed requests */
    retryAttempts: 3,
    /** Delay between retries in milliseconds */
    retryDelay: 1000,
  },

  /** Authentication service configuration */
  auth: {
    /** API URL for fetch calls (proxied in dev) */
    apiUrl: isDev ? '/auth' : 'https://auth.maskr.io',
    /** Browser URL for OAuth flow (never proxied) */
    browserUrl: 'https://auth.maskr.io',
    /** WebSocket URL for OAuth session (never proxied) */
    wsUrl: 'wss://auth.maskr.io',
    /** LocalStorage key for storing auth token */
    tokenKey: 'maskr_token',
    /** OAuth login session timeout in milliseconds */
    loginTimeout: 120000,
  },

  /** Billing service configuration */
  billing: {
    /** API URL for billing calls (proxied in dev) */
    apiUrl: isDev ? '/billing' : 'https://billing.maskr.io',
  },

  /** Penpot plugin configuration */
  penpot: {
    /** Timeout for message responses from plugin context */
    messageTimeout: 10000,
    /** Allowed origins for postMessage communication */
    allowedOrigins: [
      'https://design.penpot.app',
      'http://localhost:9001',
      'null', // For local file:// contexts
    ],
  },

  /** External links for UI */
  externalLinks: {
    account: 'https://maskr.io/account',
    pricing: 'https://maskr.io/pricing',
    help: 'https://maskr.io/help',
  },

  /** Processing configuration */
  processing: {
    /** Delay before returning to main view after processing completes */
    completionDelay: 1000,
  },
} as const

/** Type-safe config access */
export type Config = typeof config

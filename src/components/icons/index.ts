/**
 * Icon Components
 *
 * Centralized icon system for consistent iconography across the app.
 */

// Base component
export { default as IconBase } from './IconBase.vue'

// Brand icons
export { default as IconLogo } from './IconLogo.vue'
export { default as IconGoogle } from './IconGoogle.vue'

// Tool icons
export { default as IconCrop } from './IconCrop.vue'
export { default as IconExpand } from './IconExpand.vue'
export { default as IconEraser } from './IconEraser.vue'
export { default as IconScissors } from './IconScissors.vue'
export { default as IconSparkles } from './IconSparkles.vue'

// UI icons
export { default as IconImage } from './IconImage.vue'

/**
 * Tool icon mapping for dynamic rendering
 *
 * Maps tool.icon string values to icon components.
 * Use with Vue's <component :is="..."> for dynamic icons.
 *
 * @example
 * ```vue
 * <component :is="toolIcons[tool.icon]" :size="20" />
 * ```
 */
import IconCrop from './IconCrop.vue'
import IconExpand from './IconExpand.vue'
import IconEraser from './IconEraser.vue'
import IconScissors from './IconScissors.vue'
import IconSparkles from './IconSparkles.vue'

export const toolIcons = {
  crop: IconCrop,
  expand: IconExpand,
  eraser: IconEraser,
  scissors: IconScissors,
  sparkles: IconSparkles,
} as const

/** Valid tool icon names */
export type ToolIconName = keyof typeof toolIcons

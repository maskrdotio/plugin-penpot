import type { Tool, ToolId } from '../types'

export const tools: Tool[] = [
  {
    id: 'remove-bg',
    name: 'Remove Background',
    shortName: 'Remove BG',
    icon: 'crop',
    description: 'Remove background from images',
    requiresSelection: true,
  },
  {
    id: 'upscale',
    name: 'Upscale',
    shortName: 'Upscale',
    icon: 'expand',
    description: 'Enhance image resolution',
    requiresSelection: true,
    comingSoon: true,
  },
  {
    id: 'inpaint',
    name: 'Object Removal',
    shortName: 'Inpaint',
    icon: 'eraser',
    description: 'Remove unwanted objects',
    requiresSelection: true,
    comingSoon: true,
  },
  {
    id: 'segment',
    name: 'Extract Object',
    shortName: 'Extract',
    icon: 'scissors',
    description: 'Extract objects from images',
    requiresSelection: true,
    comingSoon: true,
  },
  {
    id: 'icon-gen',
    name: 'Generate Icon',
    shortName: 'Icon Gen',
    icon: 'sparkles',
    description: 'Generate icons with AI',
    requiresSelection: false,
    comingSoon: true,
  },
]

export function getToolById(id: ToolId): Tool | undefined {
  return tools.find((tool) => tool.id === id)
}

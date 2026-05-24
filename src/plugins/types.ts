import type { ToolDefinition } from "../tools/types"
import type { SkillDefinition } from "../skills/types"

export interface PluginManifest {
  name: string
  version: string
  description?: string
  author?: string
}

export interface PluginHooks {
  onLoad?: () => void | Promise<void>
  onUnload?: () => void | Promise<void>
  onConfigReload?: () => void | Promise<void>
}

export interface PluginCapabilities {
  tools?: ToolDefinition[]
  skills?: SkillDefinition[]
  hooks?: PluginHooks
}

export interface PluginContext {
  pluginName: string
  config: Record<string, unknown>
}

export interface ShenClawPlugin {
  manifest: PluginManifest
  setup: (ctx: PluginContext) => PluginCapabilities | Promise<PluginCapabilities>
}

export function definePlugin(plugin: ShenClawPlugin): ShenClawPlugin {
  return plugin
}

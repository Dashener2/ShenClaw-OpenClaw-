import type { ShenClawPlugin, PluginCapabilities, PluginContext } from "./types"
import type { ToolRegistry } from "../tools/registry"
import type { SkillRegistry } from "../skills/registry"

export class PluginRegistry {
  private plugins: Map<string, ShenClawPlugin> = new Map()
  private loaded: Map<string, PluginCapabilities> = new Map()

  register(plugin: ShenClawPlugin): void {
    if (this.plugins.has(plugin.manifest.name)) {
      throw new Error(`插件名称重复: ${plugin.manifest.name}`)
    }
    this.plugins.set(plugin.manifest.name, plugin)
  }

  async loadPlugin(
    name: string,
    ctx: PluginContext,
    toolRegistry?: ToolRegistry,
    skillRegistry?: SkillRegistry,
  ): Promise<PluginCapabilities> {
    const plugin = this.plugins.get(name)
    if (!plugin) {
      throw new Error(`未找到插件: ${name}`)
    }

    const capabilities = await plugin.setup(ctx)
    this.loaded.set(name, capabilities)

    if (capabilities.tools && toolRegistry) {
      for (const tool of capabilities.tools) {
        toolRegistry.register(tool)
      }
    }

    if (capabilities.skills && skillRegistry) {
      for (const skill of capabilities.skills) {
        skillRegistry.register(skill)
      }
    }

    if (capabilities.hooks?.onLoad) {
      await capabilities.hooks.onLoad()
    }

    return capabilities
  }

  list(): string[] {
    return Array.from(this.plugins.keys())
  }
}

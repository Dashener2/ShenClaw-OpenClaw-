import type { ToolContext, ToolResult } from "./types"
import type { ToolRegistry } from "./registry"

export class ToolExecutor {
  constructor(private registry: ToolRegistry) {}

  async execute(
    toolCall: { name: string; arguments: Record<string, unknown>; id: string },
    ctx: ToolContext,
  ): Promise<ToolResult> {
    const tool = this.registry.get(toolCall.name)
    if (!tool) {
      return {
        content: `错误: 未找到工具 "${toolCall.name}"`,
        isError: true,
      }
    }

    if (tool.dangerLevel === "confirm") {
      console.warn(`[安全] 工具 "${toolCall.name}" 需要用户确认，参数:`, JSON.stringify(toolCall.arguments))
    }

    if (tool.dangerLevel === "forbidden") {
      return {
        content: `错误: 工具 "${toolCall.name}" 已被禁止执行`,
        isError: true,
      }
    }

    try {
      const result = await tool.execute(toolCall.arguments, ctx)
      return result
    } catch (err) {
      return {
        content: `执行工具 "${toolCall.name}" 时出错: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      }
    }
  }
}

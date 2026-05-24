import type { ToolDefinition, ToolResult } from "../types"

export const echoTool: ToolDefinition = {
  name: "echo",
  description: "返回输入的内容，用于测试工具调用",
  parameters: {
    type: "object",
    properties: {
      text: { type: "string" },
    },
    required: ["text"],
  },
  dangerLevel: "safe",
  category: "testing",
  execute: (params): ToolResult => {
    return {
      content: params.text as string,
    }
  },
}

import { readFile } from "fs/promises"
import type { ToolDefinition } from "../types"

export const fileReadTool: ToolDefinition = {
  name: "file_read",
  description: "读取指定文件的内容（需要用户确认）",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "文件路径（绝对路径或相对路径）" },
    },
    required: ["path"],
  },
  dangerLevel: "confirm",
  category: "file",
  execute: async (params) => {
    const filePath = String(params.path ?? "").trim()
    if (!filePath) {
      return { content: "错误: 未提供文件路径", isError: true }
    }

    try {
      const content = await readFile(filePath, "utf-8")
      const maxLen = 5000
      if (content.length <= maxLen) {
        return { content: `文件: ${filePath}\n\n${content}` }
      }
      return {
        content: `文件: ${filePath}\n\n${content.slice(0, maxLen)}\n\n...（文件共 ${content.length} 字符，仅显示前 ${maxLen} 字符）`,
        metadata: { totalLength: content.length },
      }
    } catch (err) {
      return {
        content: `读取文件 "${filePath}" 时出错: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      }
    }
  },
}

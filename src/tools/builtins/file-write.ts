import { writeFile } from "fs/promises"
import type { ToolDefinition } from "../types"

export const fileWriteTool: ToolDefinition = {
  name: "file_write",
  description: "将内容写入指定文件（需要用户确认），如果文件已存在会覆盖",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "文件路径（绝对路径或相对路径）" },
      content: { type: "string", description: "要写入的文件内容" },
    },
    required: ["path", "content"],
  },
  dangerLevel: "confirm",
  category: "file",
  execute: async (params) => {
    const filePath = String(params.path ?? "").trim()
    const content = String(params.content ?? "")

    if (!filePath) {
      return { content: "错误: 未提供文件路径", isError: true }
    }

    try {
      await writeFile(filePath, content, "utf-8")
      return { content: `文件 "${filePath}" 写入成功（${content.length} 字符）` }
    } catch (err) {
      return {
        content: `写入文件 "${filePath}" 时出错: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      }
    }
  },
}

import type { ToolDefinition } from "../types"

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

export const webFetchTool: ToolDefinition = {
  name: "web_fetch",
  description: "获取指定 URL 的网页内容并提取纯文本",
  parameters: {
    type: "object",
    properties: {
      url: { type: "string", description: "要获取的网页 URL" },
    },
    required: ["url"],
  },
  dangerLevel: "safe",
  category: "web",
  execute: async (params) => {
    const url = String(params.url ?? "").trim()

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return { content: `错误: 无效的 URL "${url}"，必须以 http:// 或 https:// 开头`, isError: true }
    }

    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "ShenClaw/1.0" },
        signal: AbortSignal.timeout(10000),
      })

      if (!res.ok) {
        return { content: `错误: HTTP ${res.status} ${res.statusText}`, isError: true }
      }

      const text = await res.text()
      const cleaned = stripHtml(text)
      const maxLen = 2000

      if (cleaned.length <= maxLen) {
        return { content: `URL: ${url}\n\n${cleaned}` }
      }

      return {
        content: `URL: ${url}\n\n${cleaned.slice(0, maxLen)}\n\n...（内容已截断，共 ${cleaned.length} 字符，仅显示前 ${maxLen} 字符）`,
        metadata: { totalLength: cleaned.length },
      }
    } catch (err) {
      return {
        content: `获取 URL 时出错: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      }
    }
  },
}

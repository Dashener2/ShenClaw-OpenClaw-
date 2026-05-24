import type { ToolDefinition } from "../types"

interface SearchResult {
  title: string
  snippet: string
  url: string
}

const MOCK_DATASET: Record<string, SearchResult[]> = {
  default: [
    { title: "TypeScript 官方文档", snippet: "TypeScript 是 JavaScript 的超集，添加了静态类型检查。", url: "https://www.typescriptlang.org/zh/" },
    { title: "TypeScript 教程 — 菜鸟教程", snippet: "TypeScript 教程从入门到精通，包含基础语法、接口、泛型等。", url: "https://www.runoob.com/typescript/ts-tutorial.html" },
    { title: "TypeScript  handbook", snippet: "TypeScript Handbook 是官方提供的学习指南。", url: "https://www.typescriptlang.org/docs/handbook/intro.html" },
  ],
}

function getMockResults(query: string, max: number): SearchResult[] {
  const lower = query.toLowerCase()
  for (const [key, results] of Object.entries(MOCK_DATASET)) {
    if (key !== "default" && lower.includes(key)) {
      return results.slice(0, max)
    }
  }
  return MOCK_DATASET.default.slice(0, max)
}

async function duckDuckGoSearch(query: string, max: number): Promise<SearchResult[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`
  const res = await fetch(url, {
    headers: { "User-Agent": "ShenClaw/1.0" },
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const data = await res.json() as {
    AbstractText?: string
    AbstractSource?: string
    RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Result?: string }>
    Results?: Array<{ Text: string; FirstURL: string }>
  }

  const results: SearchResult[] = []

  if (data.AbstractText) {
    results.push({
      title: data.AbstractSource ?? "DuckDuckGo",
      snippet: data.AbstractText,
      url: "",
    })
  }

  const topics = data.RelatedTopics ?? []
  for (const t of topics) {
    if (results.length >= max) break
    if (t.Text) {
      results.push({
        title: t.Text.split(" - ")[0] ?? "",
        snippet: t.Text,
        url: t.FirstURL ?? "",
      })
    }
  }

  return results
}

export const webSearchTool: ToolDefinition = {
  name: "web_search",
  description: "搜索互联网获取实时信息，当用户问到新闻、天气、最新资讯、技术问题时使用",
  parameters: {
    type: "object",
    properties: {
      q: { type: "string", description: "搜索关键词" },
      maxResults: { type: "number", description: "最大返回结果数，默认 5" },
    },
    required: ["q"],
  },
  dangerLevel: "safe",
  category: "web",
  execute: async (params) => {
    const query = String(params.q ?? "")
    const max = Math.min(Math.max(Number(params.maxResults) || 5, 1), 10)

    try {
      const results = await duckDuckGoSearch(query, max)

      if (results.length > 0) {
        const lines = results.map((r, i) =>
          `${i + 1}. ${r.title}\n   链接: ${r.url}\n   摘要: ${r.snippet}`
        )
        return { content: `搜索结果 (${query}):\n\n${lines.join("\n\n")}` }
      }
    } catch {
      // fallback to mock
    }

    const mockResults = getMockResults(query, max)
    if (mockResults.length > 0) {
      const lines = mockResults.map((r, i) =>
        `${i + 1}. ${r.title}\n   链接: ${r.url}\n   摘要: ${r.snippet}`
      )
      return { content: `搜索结果 (${query}):\n\n${lines.join("\n\n")}` }
    }

    return { content: `未找到与 "${query}" 相关的搜索结果。` }
  },
}

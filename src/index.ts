import { Hono } from "hono"
import { serve } from "@hono/node-server"
import { readFileSync } from "fs"
import { join } from "path"
import { ToolRegistry } from "./tools/registry"
import { ToolExecutor } from "./tools/executor"
import { echoTool } from "./tools/builtins/echo"
import { webSearchTool } from "./tools/builtins/web-search"
import { webFetchTool } from "./tools/builtins/web-fetch"
import { fileReadTool } from "./tools/builtins/file-read"
import { fileWriteTool } from "./tools/builtins/file-write"
import { weatherTool } from "./tools/builtins/weather"
import { browserControlTool } from "./tools/builtins/browser-control"
import { SkillRegistry } from "./skills/registry"
import { AgentRuntime } from "./agent/index"
import { OpenAICompatibleProvider } from "./provider/openai-compat"
import { ChannelRegistry } from "./channel/registry"
import { createTelegramChannel } from "../channels/telegram/src/index"

const toolRegistry = new ToolRegistry()
toolRegistry.register(echoTool)
toolRegistry.register(webSearchTool)
toolRegistry.register(webFetchTool)
toolRegistry.register(fileReadTool)
toolRegistry.register(fileWriteTool)
toolRegistry.register(weatherTool)
toolRegistry.register(browserControlTool)

const toolExecutor = new ToolExecutor(toolRegistry)

const skillRegistry = new SkillRegistry()

console.log("ShenClaw 启动中...")
console.log("已注册工具:", toolRegistry.list().map((t) => t.name).join(", "))

const baseURL = process.env.PROVIDER_BASE_URL ?? "https://api.deepseek.com"
const apiKey = process.env.PROVIDER_API_KEY ?? ""
const model = process.env.PROVIDER_MODEL ?? "deepseek-chat"

if (!apiKey) {
  console.log("未配置 PROVIDER_API_KEY，服务无法启动")
  process.exit(1)
}

const provider = new OpenAICompatibleProvider(baseURL, apiKey, model)

const agentRuntime = new AgentRuntime(
  provider,
  toolRegistry,
  toolExecutor,
  skillRegistry,
  model,
)

const channelRegistry = new ChannelRegistry()

const telegramToken = process.env.TELEGRAM_BOT_TOKEN ?? ""
if (telegramToken) {
  const telegramChannel = createTelegramChannel(
    {
      botToken: telegramToken,
      proxyUrl: process.env.TELEGRAM_PROXY_URL || undefined,
    },
    async (msg) => {
      const reply = await agentRuntime.process(msg.text, msg.chatId)
      await msg.replyTo(reply)
    },
  )
  channelRegistry.register(telegramChannel)
  console.log("Telegram 通道已注册")
}

const app = new Hono()

const html = readFileSync(join(__dirname, "../public/index.html"), "utf-8")

app.get("/", (c) => c.html(html))
app.get("/api/status", (c) => c.json({ status: "ok", name: "ShenClaw" }))

app.get("/api/config", (c) =>
  c.json({
    model,
    tools: toolRegistry.list().map((t) => ({ name: t.name, description: t.description, category: t.category })),
    channels: channelRegistry.list().map((ch) => ({ id: ch.id })),
    systemPrompt: agentRuntime.getSystemPrompt(),
  }),
)

app.post("/api/config", async (c) => {
  const body = await c.req.json()
  if (body.systemPrompt && typeof body.systemPrompt === "string") {
    agentRuntime.setSystemPrompt(body.systemPrompt)
    return c.json({ ok: true, message: "System prompt 已更新" })
  }
  return c.json({ error: "缺少 systemPrompt 字段" }, 400)
})

app.post("/api/chat", async (c) => {
  const body = await c.req.json()
  const message = body.message
  const sessionId = body.sessionId ?? "default"

  if (!message || typeof message !== "string") {
    return c.json({ error: "请提供 message 字段" }, 400)
  }

  const reply = await agentRuntime.process(message, sessionId)
  return c.json({ reply, sessionId })
})

const port = parseInt(process.env.PORT ?? "3000", 10)

serve({ fetch: app.fetch, port }, async (info) => {
  console.log(`ShenClaw HTTP 服务运行在 http://localhost:${info.port}`)

  if (channelRegistry.list().length > 0) {
    await channelRegistry.startAll()
    console.log("所有通道已启动")
  }
})

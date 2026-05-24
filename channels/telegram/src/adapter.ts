import { Telegraf, type Context } from "telegraf"
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { HttpsProxyAgent } = require("https-proxy-agent")

export type TelegramMessageHandler = (chatId: string, userId: string, text: string) => void | Promise<void>

export class TelegramAdapter {
  private bot: Telegraf
  private handler: TelegramMessageHandler | null = null

  constructor(token: string, proxyUrl?: string) {
    const opts: ConstructorParameters<typeof Telegraf>[1] = {}
    if (proxyUrl) {
      opts.telegram = { agent: new HttpsProxyAgent(proxyUrl) }
    }
    this.bot = new Telegraf(token, opts)
  }

  onMessage(handler: TelegramMessageHandler): void {
    this.handler = handler
  }

  async start(): Promise<void> {
    this.bot.on("text", async (ctx: Context) => {
      const chatId = String(ctx.chat?.id ?? "")
      const userId = String(ctx.from?.id ?? "")
      const msg = ctx.message
      if (!msg || !("text" in msg)) return
      const text = (msg as { text: string }).text

      if (!chatId || !text) return

      try {
        await ctx.sendChatAction("typing")
      } catch {
        // ignore typing action errors
      }

      if (this.handler) {
        await this.handler(chatId, userId, text)
      }
    })

    await this.bot.launch()
  }

  async send(chatId: string, text: string): Promise<void> {
    await this.bot.telegram.sendMessage(chatId, text, {
      parse_mode: "Markdown",
    })
  }

  async stop(): Promise<void> {
    await this.bot.stop()
  }
}

import { TelegramAdapter } from "./adapter"
import { toInternalMessage } from "./handler"
import type { InternalMessage } from "./types"

export interface IChannel {
  id: string
  start: () => Promise<void>
  stop: () => Promise<void>
  sendMessage: (chatId: string, text: string) => Promise<void>
}

export type MessageHandler = (msg: InternalMessage) => Promise<string | void>

export interface TelegramChannelConfig {
  botToken: string
  proxyUrl?: string
}

export function createTelegramChannel(
  config: TelegramChannelConfig,
  onMessage: MessageHandler,
): IChannel {
  const adapter = new TelegramAdapter(config.botToken, config.proxyUrl)

  adapter.onMessage(async (chatId, userId, text) => {
    const internalMsg = toInternalMessage({ chatId, userId, text }, adapter)
    const reply = await onMessage(internalMsg)
    if (reply) {
      await adapter.send(chatId, reply)
    }
  })

  return {
    id: "telegram",
    start: () => adapter.start(),
    stop: () => adapter.stop(),
    sendMessage: (chatId, text) => adapter.send(chatId, text),
  }
}

import type { TelegramMessage, InternalMessage } from "./types"
import type { TelegramAdapter } from "./adapter"

export function toInternalMessage(
  msg: TelegramMessage,
  adapter: TelegramAdapter,
): InternalMessage {
  return {
    platform: "telegram",
    channelId: "telegram",
    userId: msg.userId,
    chatId: msg.chatId,
    text: msg.text,
    replyTo: async (text: string) => {
      await adapter.send(msg.chatId, text)
    },
  }
}

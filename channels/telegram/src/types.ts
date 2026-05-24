export interface TelegramMessage {
  chatId: string
  userId: string
  text: string
}

export interface InternalMessage {
  platform: string
  channelId: string
  userId: string
  chatId: string
  text: string
  replyTo: (text: string) => Promise<void>
}

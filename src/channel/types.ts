export interface IChannel {
  id: string
  start: () => Promise<void>
  stop: () => Promise<void>
  sendMessage: (chatId: string, text: string) => Promise<void>
}

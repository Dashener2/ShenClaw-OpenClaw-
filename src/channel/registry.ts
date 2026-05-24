import type { IChannel } from "./types"

export class ChannelRegistry {
  private channels: Map<string, IChannel> = new Map()

  register(channel: IChannel): void {
    if (this.channels.has(channel.id)) {
      throw new Error(`通道 ID 重复: ${channel.id}`)
    }
    this.channels.set(channel.id, channel)
  }

  get(id: string): IChannel | undefined {
    return this.channels.get(id)
  }

  list(): IChannel[] {
    return Array.from(this.channels.values())
  }

  async startAll(): Promise<void> {
    for (const channel of this.channels.values()) {
      await channel.start()
    }
  }

  async stopAll(): Promise<void> {
    for (const channel of this.channels.values()) {
      await channel.stop()
    }
  }
}

import type { ChatMessage, ToolCall } from "../provider/types"
import type { IProvider } from "../provider/types"

export type { ToolCall }

export interface Message extends ChatMessage {
  sessionId: string
  timestamp?: number
}

export interface AgentConfig {
  systemPrompt: string
  maxToolLoopIterations: number
  model: string
  provider: IProvider
}

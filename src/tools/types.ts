export type JsonSchema = {
  type: "object"
  properties: Record<string, unknown>
  required?: string[]
  description?: string
}

export type Session = {
  id: string
  userId: string
  messages: unknown[]
  createdAt: number
  updatedAt: number
}

export interface ToolContext {
  signal?: AbortSignal
  toolCallId: string
  session: Session
  userId: string
}

export interface ToolResult {
  content: string
  isError?: boolean
  metadata?: Record<string, unknown>
}

export interface ToolDefinition {
  name: string
  description: string
  parameters: JsonSchema
  execute: (params: Record<string, unknown>, ctx: ToolContext) => ToolResult | Promise<ToolResult>
  dangerLevel?: "safe" | "confirm" | "forbidden"
  category?: string
  pluginId?: string
}

export type ChatRole = "system" | "user" | "assistant" | "tool"

export interface ToolCall {
  id: string
  type: "function"
  function: {
    name: string
    arguments: string
  }
}

export interface ChatMessage {
  role: ChatRole
  content?: string | null
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string
}

export interface ToolDefinitionForProvider {
  type: "function"
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  tools?: ToolDefinitionForProvider[]
  tool_choice?: "auto" | "none" | { type: "function"; function: { name: string } }
  temperature?: number
  max_tokens?: number
}

export interface ChatCompletionResponse {
  id: string
  model: string
  choices: {
    index: number
    message: ChatMessage
    finish_reason: "stop" | "length" | "tool_calls" | "error"
  }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface IProvider {
  chatComplete(req: ChatCompletionRequest): Promise<ChatCompletionResponse>
}

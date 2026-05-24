import type { IProvider, ChatCompletionRequest, ChatCompletionResponse } from "./types"

export class OpenAICompatibleProvider implements IProvider {
  private baseURL: string
  private apiKey: string
  private model: string

  constructor(baseURL: string, apiKey: string, model: string) {
    this.baseURL = baseURL.replace(/\/+$/, "")
    this.apiKey = apiKey
    this.model = model
  }

  async chatComplete(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const url = `${this.baseURL}/v1/chat/completions`

    const body: Record<string, unknown> = {
      model: this.model,
      messages: req.messages,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.max_tokens ?? 4096,
    }

    if (req.tools && req.tools.length > 0) {
      body.tools = req.tools
      body.tool_choice = req.tool_choice ?? "auto"
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Provider API 错误 (${response.status}): ${text}`)
    }

    const data = await response.json()
    return data as ChatCompletionResponse
  }
}

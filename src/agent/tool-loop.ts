import type { IProvider, ChatMessage, ToolDefinitionForProvider } from "../provider/types"
import type { ToolRegistry } from "../tools/registry"
import type { ToolExecutor } from "../tools/executor"
import type { ToolContext, Session } from "../tools/types"
import type { Message } from "./types"

export class ToolLoop {
  private provider: IProvider
  private toolRegistry: ToolRegistry
  private toolExecutor: ToolExecutor
  private model: string

  constructor(
    provider: IProvider,
    toolRegistry: ToolRegistry,
    toolExecutor: ToolExecutor,
    model: string,
  ) {
    this.provider = provider
    this.toolRegistry = toolRegistry
    this.toolExecutor = toolExecutor
    this.model = model
  }

  private buildProviderTools(): ToolDefinitionForProvider[] {
    return this.toolRegistry.list().map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters as Record<string, unknown>,
      },
    }))
  }

  async run(
    messages: Message[],
    maxIterations: number = 10,
    onChunk?: (chunk: string) => void,
  ): Promise<string> {
    const chatMessages: ChatMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
      tool_calls: m.tool_calls,
      tool_call_id: m.tool_call_id,
    }))

    const tools = this.buildProviderTools()
    const hasTools = tools.length > 0

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const request: Parameters<IProvider["chatComplete"]>[0] = {
        model: this.model,
        messages: chatMessages,
      }

      if (hasTools) {
        request.tools = tools
        request.tool_choice = "auto"
      }

      const response = await this.provider.chatComplete(request)

      const choice = response.choices[0]
      if (!choice) {
        throw new Error("Provider 返回空 choices")
      }

      const msg = choice.message

      if (choice.finish_reason === "tool_calls" && msg.tool_calls && msg.tool_calls.length > 0) {
        chatMessages.push({
          role: "assistant",
          content: msg.content,
          tool_calls: msg.tool_calls,
        })

        for (const tc of msg.tool_calls) {
          const session: Session = {
            id: "",
            userId: "",
            messages: [],
            createdAt: 0,
            updatedAt: 0,
          }

          const ctx: ToolContext = {
            toolCallId: tc.id,
            session,
            userId: "",
          }

          let parsedArgs: Record<string, unknown>
          try {
            parsedArgs = JSON.parse(tc.function.arguments)
          } catch {
            chatMessages.push({
              role: "tool",
              tool_call_id: tc.id,
              content: `参数解析失败: ${tc.function.arguments}`,
            })
            continue
          }

          const result = await this.toolExecutor.execute(
            { name: tc.function.name, arguments: parsedArgs, id: tc.id },
            ctx,
          )

          chatMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: result.content,
          })
        }

        continue
      }

      const content = msg.content ?? ""
      if (onChunk) {
        onChunk(content)
      }
      return content
    }

    throw new Error(`Tool 循环超过最大迭代次数 (${maxIterations})`)
  }
}

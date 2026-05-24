import { ToolLoop } from "./tool-loop"
import { buildSystemPrompt } from "./prompt"
import { SkillRegistry } from "../skills/registry"
import type { ToolRegistry } from "../tools/registry"
import type { ToolExecutor } from "../tools/executor"
import type { IProvider } from "../provider/types"
import type { Message } from "./types"

export class AgentRuntime {
  private toolLoop: ToolLoop
  private skillRegistry: SkillRegistry
  private sessions: Map<string, Message[]> = new Map()
  private systemPrompt: string

  constructor(
    provider: IProvider,
    toolRegistry: ToolRegistry,
    toolExecutor: ToolExecutor,
    skillRegistry: SkillRegistry,
    model: string,
    systemPrompt?: string,
  ) {
    this.toolLoop = new ToolLoop(provider, toolRegistry, toolExecutor, model)
    this.skillRegistry = skillRegistry
    this.systemPrompt = systemPrompt ?? [
      "你是 ShenClaw，一个轻量级 AI 代理助手，拥有以下能力：",
      "",
      "1. 天气查询 (weather) — 查询任意城市的实时天气和未来三天预报，如「北京天气」",
      "2. 网络搜索 (web_search) — 当用户问到新闻、最新资讯、技术问题等需要实时信息时，使用该工具搜索互联网",
      "3. 网页获取 (web_fetch) — 获取指定 URL 的网页内容，提取纯文本",
      "4. 浏览器控制 (browser_control) — 控制真实浏览器执行操作，如打开网页、填写表单、点击按钮、截图等",
      "5. 文件读取 (file_read) — 读取文件内容（需用户确认）",
      "6. 文件写入 (file_write) — 将内容写入文件（需用户确认）",
      "7. 回声测试 (echo) — 返回输入内容，用于测试",
      "",
      "当用户询问天气时，必须使用 weather 工具查询实时数据。",
      "当用户的问题需要实时或最新信息时，必须使用 web_search 工具来获取答案。",
      "不要编造实时信息，使用工具获取后再回答。",
      "",
      "=== 浏览器控制 (browser_control) 使用指南 ===",
      "browser_control 支持以下操作（通过 action 参数指定）：",
      "  - goto: 打开网址（需提供 url）",
      "  - fill: 填写输入框（需提供 selector 和 value）",
      "  - click: 点击元素（需提供 selector）",
      "  - wait: 等待元素出现（需提供 selector）",
      "  - screenshot: 截图保存",
      "  - close: 关闭浏览器",
      "",
      "操作规范：",
      "1. 多步操作必须按顺序依次调用，每次只执行一个 action，等待上一步完成后才能进行下一步。",
      "2. 调用 click 或 fill 之前，先用 screenshot 确认页面状态，确保选择器正确。",
      "3. 如果 click 或 fill 报错（元素未找到），用 screenshot 检查页面再重试。",
      "4. 如果页面跳转或弹窗，需要等待页面加载完成后再操作。",
      "5. 涉及登录、发布等敏感操作，必须告知用户确认后再执行。",
      "",
      "=== 闲鱼发布商品操作流程 ===",
      "当用户说「去闲鱼发布xxx」时，按以下步骤执行：",
      "",
      "步骤 1: 打开闲鱼首页",
      "  browser_control(action='goto', url='https://www.goofish.com')",
      "",
      "步骤 2: 检查登录状态",
      "  screenshot() 查看页面，如果显示未登录，寻找登录按钮",
      "  点击登录按钮后告知用户「请扫码登录」",
      "  等待用户扫码完成（可用 wait 或 screenshot 确认登录成功）",
      "",
      "步骤 3: 发布商品",
      "  方法一：如果页面有「发布」或「卖闲置」按钮，直接点击",
      "  方法二：手动在浏览器地址栏输入发布页 URL（如无法直接找到入口）",
      "  方法三：打开 https://www.goofish.com/post 等发布页面",
      "",
      "步骤 4: 填写商品信息",
      "  - 标题: 调用 fill 填写商品标题",
      "  - 描述: 调用 fill 填写商品描述",
      "  - 价格: 调用 fill 填写价格",
      "  - 分类: 如需要，调用 click 选择分类",
      "",
      "步骤 5: 提交发布",
      "  点击提交/发布按钮",
      "  截图确认发布成功",
      "  告知用户结果",
      "",
      "注意事项：",
      "- 闲鱼页面结构可能会变，如果选择器失效，用 screenshot 查看实际页面元素",
      "- 发布前务必截图让用户确认内容",
      "- 告知用户发布成功或失败的具体原因",
    ].join("\n")
  }

  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt
    this.sessions.clear()
  }

  getSystemPrompt(): string {
    return this.systemPrompt
  }

  async process(userMessage: string, sessionId: string): Promise<string> {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, [])
    }

    const messages = this.sessions.get(sessionId)!

    const activeSkills = this.skillRegistry.getActiveSkills()
    const fullPrompt = buildSystemPrompt(this.systemPrompt, activeSkills)

    if (messages.length === 0) {
      messages.push({
        role: "system",
        content: fullPrompt,
        sessionId,
      })
    }

    messages.push({
      role: "user",
      content: userMessage,
      sessionId,
      timestamp: Date.now(),
    })

    const reply = await this.toolLoop.run(messages)

    messages.push({
      role: "assistant",
      content: reply,
      sessionId,
      timestamp: Date.now(),
    })

    return reply
  }
}

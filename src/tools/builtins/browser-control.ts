import { chromium, type BrowserContext, type Page } from "playwright"
import { existsSync, mkdirSync } from "fs"
import { join } from "path"
import type { ToolDefinition } from "../types"

class BrowserManager {
  private context: BrowserContext | null = null
  private page: Page | null = null
  private userDataDir: string

  constructor() {
    this.userDataDir = join(process.cwd(), "data", "browser-profile")
    if (!existsSync(this.userDataDir)) {
      mkdirSync(this.userDataDir, { recursive: true })
    }
  }

  async getPage(): Promise<Page> {
    if (this.page && !this.page.isClosed()) {
      return this.page
    }

    if (!this.context) {
      this.context = await chromium.launchPersistentContext(this.userDataDir, {
        headless: false,
        args: ["--start-maximized"],
        viewport: null,
      })
    }

    if (this.context.pages().length === 0) {
      this.page = await this.context.newPage()
    } else {
      this.page = this.context.pages()[0]
    }

    return this.page
  }

  async goto(url: string): Promise<string> {
    const page = await this.getPage()
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 })
    await page.waitForLoadState("networkidle").catch(() => {})
    await page.waitForTimeout(1500)
    return `已打开 ${url}，当前标题: ${await page.title()}`
  }

  async fill(selector: string, value: string): Promise<string> {
    const page = await this.getPage()
    await page.waitForSelector(selector, { state: "attached", timeout: 10000 })

    const isVisible = await page.locator(selector).isVisible().catch(() => false)
    if (isVisible) {
      await page.fill(selector, value)
    } else {
      await page.evaluate((args: unknown) => {
        const [sel, val] = args as [string, string]
        const d = globalThis as unknown as { document: { querySelector(s: string): unknown } }
        const el = d.document.querySelector(sel) as { value?: string; dispatchEvent(e: Event): void }
        if (el) { el.value = val; el.dispatchEvent(new Event("input", { bubbles: true })) }
      }, [selector, value])
    }
    return `已填写 ${selector} = "${value}"`
  }

  async click(selector: string): Promise<string> {
    const page = await this.getPage()
    await page.waitForSelector(selector, { state: "attached", timeout: 10000 })

    const isVisible = await page.locator(selector).isVisible().catch(() => false)
    if (isVisible) {
      await page.click(selector)
    } else {
      await page.evaluate((sel: unknown) => {
        const d = globalThis as unknown as { document: { querySelector(s: string): unknown } }
        const el = d.document.querySelector(sel as string) as { click?(): void }
        if (el && el.click) el.click()
      }, selector)
    }

    const text = await page.textContent(selector).catch(() => "")
    return `已点击 ${selector}${text ? ` (元素内容: ${text.trim().slice(0, 50)})` : ""}`
  }

  async waitFor(selector: string): Promise<string> {
    const page = await this.getPage()
    await page.waitForSelector(selector, { state: "attached", timeout: 15000 })
    const text = await page.textContent(selector).catch(() => "")
    return `元素 ${selector} 已出现${text ? ` (内容: ${text.trim().slice(0, 50)})` : ""}`
  }

  async screenshot(): Promise<string> {
    const page = await this.getPage()
    const filename = `screenshot-${Date.now()}.png`
    const filepath = join(process.cwd(), "data", "screenshots", filename)
    await page.screenshot({ path: filepath, fullPage: false })
    return `截图已保存: ${filepath}`
  }

  async close(): Promise<string> {
    if (this.context) {
      await this.context.close().catch(() => {})
    }
    this.page = null
    this.context = null
    return "浏览器已关闭！"
  }
}

const browserManager = new BrowserManager()

export const browserControlTool: ToolDefinition = {
  name: "browser_control",
  description: "控制真实浏览器执行操作，支持: 打开网址(goto)、填写输入框(fill)、点击元素(click)、等待元素出现(wait)、截图(screenshot)、关闭浏览器(close)。涉及登录、发布等敏感操作需要用户确认。",
  parameters: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["goto", "fill", "click", "wait", "screenshot", "close"],
        description: "操作类型: goto=打开网址, fill=填写, click=点击, wait=等待元素, screenshot=截图, close=关闭",
      },
      selector: {
        type: "string",
        description: "CSS 选择器或 XPath（fill/click/wait 操作需要）",
      },
      value: {
        type: "string",
        description: "填写的内容（fill 操作需要）",
      },
      url: {
        type: "string",
        description: "要打开的网址（goto 操作需要）",
      },
    },
    required: ["action"],
  },
  dangerLevel: "confirm",
  category: "browser",
  execute: async (params) => {
    const action = String(params.action ?? "")
    const selector = String(params.selector ?? "")
    const value = String(params.value ?? "")
    const url = String(params.url ?? "")

    try {
      switch (action) {
        case "goto":
          if (!url) return { content: "错误: goto 操作需要提供 url 参数", isError: true }
          return { content: await browserManager.goto(url) }

        case "fill":
          if (!selector) return { content: "错误: fill 操作需要提供 selector 参数", isError: true }
          return { content: await browserManager.fill(selector, value) }

        case "click":
          if (!selector) return { content: "错误: click 操作需要提供 selector 参数", isError: true }
          return { content: await browserManager.click(selector) }

        case "wait":
          if (!selector) return { content: "错误: wait 操作需要提供 selector 参数", isError: true }
          return { content: await browserManager.waitFor(selector) }

        case "screenshot":
          return { content: await browserManager.screenshot() }

        case "close":
          return { content: await browserManager.close() }

        default:
          return { content: `错误: 未知操作 "${action}"，支持: goto, fill, click, wait, screenshot, close`, isError: true }
      }
    } catch (err) {
      return {
        content: `浏览器操作失败 (${action}): ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      }
    }
  },
}

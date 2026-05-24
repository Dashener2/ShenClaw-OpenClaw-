export interface SkillDefinition {
  name: string
  label: string
  description: string
  tools: string[]
  systemPrompt?: string
  activation?: {
    keywords?: string[]
    alwaysOn?: boolean
  }
  guidePath?: string
  pluginId?: string
}

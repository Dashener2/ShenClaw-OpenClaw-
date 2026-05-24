import type { SkillDefinition } from "./types"

export function injectSkills(basePrompt: string, skills: SkillDefinition[]): string {
  const parts: string[] = [basePrompt]

  for (const skill of skills) {
    if (skill.systemPrompt) {
      parts.push(`\n[技能: ${skill.label}] ${skill.systemPrompt}`)
    }
  }

  return parts.join("\n")
}

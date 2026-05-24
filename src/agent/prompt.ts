import type { SkillDefinition } from "../skills/types"
import { injectSkills } from "../skills/injector"

export function buildSystemPrompt(
  basePrompt: string,
  skills: SkillDefinition[],
): string {
  return injectSkills(basePrompt, skills)
}

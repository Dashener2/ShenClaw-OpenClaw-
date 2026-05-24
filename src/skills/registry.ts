import type { SkillDefinition } from "./types"

export class SkillRegistry {
  private skills: Map<string, SkillDefinition> = new Map()

  register(skill: SkillDefinition): void {
    if (this.skills.has(skill.name)) {
      throw new Error(`技能名称重复: ${skill.name}`)
    }
    this.skills.set(skill.name, skill)
  }

  get(name: string): SkillDefinition | undefined {
    return this.skills.get(name)
  }

  list(): SkillDefinition[] {
    return Array.from(this.skills.values())
  }

  getActiveSkills(): SkillDefinition[] {
    return this.list().filter((s) => s.activation?.alwaysOn)
  }
}

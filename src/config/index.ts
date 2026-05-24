import { z } from "zod"

export const GatewayConfigSchema = z.object({
  port: z.number().default(3000),
  host: z.string().default("0.0.0.0"),
  logLevel: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
  plugins: z.record(z.string(), z.object({
    enabled: z.boolean().default(true),
    options: z.record(z.string(), z.unknown()).optional(),
  })).default({}),
  skills: z.record(z.string(), z.object({
    enabled: z.boolean().default(true),
    options: z.record(z.string(), z.unknown()).optional(),
  })).default({}),
  channels: z.record(z.string(), z.object({
    enabled: z.boolean().default(true),
    options: z.record(z.string(), z.unknown()).optional(),
  })).default({}),
  providers: z.record(z.string(), z.object({
    enabled: z.boolean().default(true),
    apiKey: z.string().optional(),
    baseUrl: z.string().optional(),
    options: z.record(z.string(), z.unknown()).optional(),
  })).default({}),
})

export type GatewayConfig = z.infer<typeof GatewayConfigSchema>

export function loadConfig(overrides?: Partial<GatewayConfig>): GatewayConfig {
  return GatewayConfigSchema.parse(overrides ?? {})
}

export function defineConfig(config: GatewayConfig): GatewayConfig {
  return GatewayConfigSchema.parse(config)
}

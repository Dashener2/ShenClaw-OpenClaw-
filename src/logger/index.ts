import pino from "pino"

let loggerInstance: pino.Logger | null = null

export function createLogger(level: string = "info"): pino.Logger {
  loggerInstance = pino({
    level,
    transport: {
      target: "pino/file",
      options: { destination: 1 },
    },
  })
  return loggerInstance
}

export function getLogger(): pino.Logger {
  if (!loggerInstance) {
    loggerInstance = createLogger()
  }
  return loggerInstance
}

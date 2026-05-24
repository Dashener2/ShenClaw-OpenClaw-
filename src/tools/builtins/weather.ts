import type { ToolDefinition } from "../types"

interface WttrCondition {
  temp_C: string
  humidity: string
  windspeedKmph: string
  weatherDesc: Array<{ value: string }>
  FeelsLikeC: string
  localObsDateTime?: string
}

interface WttrResponse {
  current_condition: WttrCondition[]
  nearest_area?: Array<{
    areaName: Array<{ value: string }>
    country: Array<{ value: string }>
  }>
  weather?: Array<{
    date: string
    astronomy: Array<{ sunrise: string; sunset: string }>
    hourly: Array<{
      tempC: string
      weatherDesc: Array<{ value: string }>
      chanceofrain: string
    }>
  }>
}

function formatWeather(data: WttrResponse): string {
  const cc = data.current_condition[0]
  if (!cc) return "暂时无法获取天气数据"

  const area = data.nearest_area?.[0]
  const location = area ? `${area.areaName[0]?.value ?? ""}, ${area.country[0]?.value ?? ""}` : "未知位置"

  const lines: string[] = [
    `📍 ${location}`,
    `🌡 温度: ${cc.temp_C}°C (体感 ${cc.FeelsLikeC}°C)`,
    `☁️ 天气: ${cc.weatherDesc[0]?.value ?? "未知"}`,
    `💧 湿度: ${cc.humidity}%`,
    `🌬 风速: ${cc.windspeedKmph} km/h`,
  ]

  if (cc.localObsDateTime) {
    lines.push(`🕐 观测时间: ${cc.localObsDateTime}`)
  }

  const forecast = data.weather?.slice(0, 3)
  if (forecast && forecast.length > 0) {
    lines.push("", "📅 未来三天预报:")
    for (const day of forecast) {
      const h = day.hourly?.find((h) => h.weatherDesc[0]?.value)
      if (h) {
        lines.push(`  ${day.date}: ${h.weatherDesc[0].value}, ${h.tempC}°C, 降雨概率 ${h.chanceofrain}%`)
      }
    }
  }

  return lines.join("\n")
}

export const weatherTool: ToolDefinition = {
  name: "weather",
  description: "查询指定城市的实时天气信息和未来三天预报",
  parameters: {
    type: "object",
    properties: {
      city: { type: "string", description: "城市名称，支持中文，如 北京、上海、London、Tokyo" },
    },
    required: ["city"],
  },
  dangerLevel: "safe",
  category: "web",
  execute: async (params) => {
    const city = String(params.city ?? "").trim()
    if (!city) {
      return { content: "错误: 请提供城市名称", isError: true }
    }

    try {
      const encoded = encodeURIComponent(city)
      const url = `https://wttr.in/${encoded}?format=j1`
      const res = await fetch(url, {
        headers: { "User-Agent": "ShenClaw/1.0" },
        signal: AbortSignal.timeout(8000),
      })

      if (!res.ok) {
        if (res.status === 404) {
          return { content: `未找到城市 "${city}" 的天气信息` }
        }
        return { content: `天气 API 返回错误: HTTP ${res.status}`, isError: true }
      }

      const data = await res.json() as WttrResponse
      const formatted = formatWeather(data)
      return { content: formatted }
    } catch (err) {
      return {
        content: `获取天气信息时出错: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      }
    }
  },
}

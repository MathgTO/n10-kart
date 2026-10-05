/**
 * Opt-in weather for the setup step only (never fetched automatically; nothing about the driver is sent —
 * just the track's lat/lon and the session hour). Open-Meteo: archive API for past dates, forecast API
 * (past_days) for the last few days where the archive lags.
 */
import type { WeatherSnapshot } from './types'

const WMO: Record<number, string> = {
  0: 'Clear',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Showers',
  81: 'Showers',
  82: 'Heavy showers',
  95: 'Thunderstorm',
}

export function wmoLabel(code?: number | null): string | undefined {
  if (code == null) return undefined
  return WMO[code] ?? (code >= 50 ? 'Wet' : undefined)
}

interface Hourly {
  time: string[]
  temperature_2m: (number | null)[]
  precipitation: (number | null)[]
  weather_code: (number | null)[]
}

function pick(h: Hourly, hourIso: string): WeatherSnapshot | null {
  const i = h.time.findIndex((t) => t.startsWith(hourIso))
  if (i < 0 || h.temperature_2m[i] == null) return null
  const precip = h.precipitation[i] ?? 0
  const prev = i > 0 ? h.precipitation[i - 1] ?? 0 : 0
  const code = h.weather_code[i] ?? undefined
  return {
    airC: Math.round((h.temperature_2m[i] as number) * 10) / 10,
    conditions: wmoLabel(code),
    precipMm: precip,
    wet: precip + prev >= 0.2 || (code != null && code >= 51 && code <= 82),
    source: 'open-meteo',
    fetchedAt: new Date().toISOString(),
  }
}

/** Air temp / conditions for the session's start hour at the track. */
export async function fetchWeather(lat: number, lon: number, startUtc: string, fetchImpl: typeof fetch = fetch): Promise<WeatherSnapshot | null> {
  const d = new Date(startUtc)
  const day = startUtc.slice(0, 10)
  const hourIso = `${day}T${String(d.getUTCHours()).padStart(2, '0')}:00`
  const ageDays = (Date.now() - d.getTime()) / 86400000
  const q = `latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&hourly=temperature_2m,precipitation,weather_code&timezone=GMT`
  const urls =
    ageDays > 5
      ? [`https://archive-api.open-meteo.com/v1/archive?${q}&start_date=${day}&end_date=${day}`]
      : [`https://api.open-meteo.com/v1/forecast?${q}&past_days=7&forecast_days=1`, `https://archive-api.open-meteo.com/v1/archive?${q}&start_date=${day}&end_date=${day}`]
  for (const url of urls) {
    try {
      const r = await fetchImpl(url)
      if (!r.ok) continue
      const j = (await r.json()) as { hourly?: Hourly }
      if (j.hourly) {
        const w = pick(j.hourly, hourIso)
        if (w) return w
      }
    } catch {
      /* offline → manual entry */
    }
  }
  return null
}

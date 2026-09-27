import type { LapData, ParseResult, TelemetrySample } from './types'
export type { ParseResult }
import { synthLap } from './telemetry'
import { parseXrkFile } from './xrk'

function parseNum(v: string): number | null {
  const n = Number(String(v).trim().replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/** Parse Race Studio / MyChron CSV or native .xrk/.xrz */
export async function parseSessionFile(
  file: File,
  textOrBuf: string | ArrayBuffer
): Promise<ParseResult> {
  const name = file.name
  const lower = name.toLowerCase()

  if (lower.endsWith('.xrz') || lower.endsWith('.xrk')) {
    const buf = typeof textOrBuf === 'string' ? new TextEncoder().encode(textOrBuf).buffer : textOrBuf
    return parseXrkFile(file, buf)
  }

  if (!lower.endsWith('.csv') && typeof textOrBuf !== 'string') {
    return {
      ok: false,
      kind: 'unknown',
      laps: [],
      channels: { speed: false, rpm: false, lapTimes: false },
      message: 'Unsupported file. Use .csv, .xrz, or .xrk.',
      fileName: name,
    }
  }

  const text = typeof textOrBuf === 'string' ? textOrBuf : new TextDecoder().decode(textOrBuf)
  return parseCsvText(text, name)
}

export function parseCsvText(text: string, fileName = 'session.csv'): ParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length)
  if (lines.length < 2) {
    return {
      ok: false,
      kind: 'csv',
      laps: [],
      channels: { speed: false, rpm: false, lapTimes: false },
      message: 'CSV looks empty.',
      fileName,
    }
  }

  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase().trim())
  const lapIdx = findCol(header, ['lap', 'lap_number', 'lapnumber', 'lap #'])
  const timeIdx = findCol(header, ['laptime', 'lap_time', 'time', 'lap time', 'totaltime'])
  const speedIdx = findCol(header, ['speed', 'gps_speed', 'velocity', 'spd'])
  const rpmIdx = findCol(header, ['rpm', 'engine_rpm', 'enginerpm'])
  const distIdx = findCol(header, ['distance', 'dist', 'gps_distance', 'meters'])

  const channels = {
    speed: speedIdx >= 0,
    rpm: rpmIdx >= 0,
    lapTimes: timeIdx >= 0 || lapIdx >= 0,
  }

  // Path A: one row per lap with lap times
  if (timeIdx >= 0 && speedIdx < 0) {
    const laps: LapData[] = []
    lines.slice(1).forEach((line, i) => {
      const cols = splitCsvLine(line)
      const raw = cols[timeIdx]
      const ms = parseLapTimeToMs(raw)
      if (ms != null && ms > 1000) {
        const lap = synthLap(ms, i + 1)
        lap.index = laps.length
        laps.push(lap)
      }
    })
    if (laps.length) {
      return {
        ok: true,
        kind: 'csv',
        laps,
        channels: { ...channels, speed: true, rpm: true },
        message: `Parsed ${laps.length} laps from lap-time CSV (synthetic speed/RPM for charts).`,
        fileName,
      }
    }
  }

  // Path B: sample stream with lap markers
  if (speedIdx >= 0 || rpmIdx >= 0) {
    const byLap = new Map<number, TelemetrySample[]>()
    let autoLap = 1
    let lastLap = -1
    lines.slice(1).forEach((line, row) => {
      const cols = splitCsvLine(line)
      let lapNo = lapIdx >= 0 ? parseNum(cols[lapIdx]) : null
      if (lapNo == null) {
        // detect lap reset via distance drop
        lapNo = autoLap
      }
      if (lapNo !== lastLap && lastLap >= 0 && distIdx >= 0) {
        const d = parseNum(cols[distIdx])
        if (d != null && d < 20) autoLap++
      }
      lastLap = lapNo
      const speed = speedIdx >= 0 ? parseNum(cols[speedIdx]) ?? 0 : 60
      const rpm = rpmIdx >= 0 ? parseNum(cols[rpmIdx]) ?? 5000 : 5000
      const dist =
        distIdx >= 0
          ? Math.min(1, Math.max(0, (parseNum(cols[distIdx]) ?? row) / 1500))
          : 0
      const arr = byLap.get(lapNo) ?? []
      const t = arr.length ? arr[arr.length - 1].t + 0.1 : 0
      arr.push({
        t,
        dist: distIdx >= 0 ? dist : arr.length,
        speed,
        rpm,
      })
      byLap.set(lapNo, arr)
    })

    // normalize dist 0..1 per lap & compute time
    const laps: LapData[] = []
    for (const [, samples] of [...byLap.entries()].sort((a, b) => a[0] - b[0])) {
      if (samples.length < 5) continue
      const maxD = Math.max(...samples.map((s) => s.dist), 1)
      const norm = samples.map((s, i) => ({
        ...s,
        dist: distIdx >= 0 ? s.dist / maxD : i / (samples.length - 1),
        t: s.t || i * 0.1,
      }))
      // rescale t so last sample matches rough duration
      const duration = norm[norm.length - 1].t
      const timeMs = duration > 20 ? duration * 1000 : duration * 1000
      // if duration looks like index*0.1 only, estimate from count
      const finalMs =
        duration < 20 ? Math.round((norm.length / 180) * 62000) : Math.round(timeMs)
      const scaled = norm.map((s) => ({
        ...s,
        t: (s.dist) * (finalMs / 1000),
      }))
      const rpms = scaled.map((s) => s.rpm)
      const speeds = scaled.map((s) => s.speed)
      laps.push({
        index: laps.length,
        timeMs: finalMs,
        samples: scaled,
        minSpeed: Math.min(...speeds),
        maxSpeed: Math.max(...speeds),
        maxRpm: Math.max(...rpms),
        exitRpmFocus: scaled[Math.floor(scaled.length * 0.35)]?.rpm,
      })
    }

    if (laps.length) {
      return {
        ok: true,
        kind: 'csv',
        laps,
        channels,
        message: `Parsed ${laps.length} laps · speed ${channels.speed ? 'yes' : 'no'} · RPM ${channels.rpm ? 'yes' : 'no'}.`,
        fileName,
      }
    }
  }

  // Path C: bare list of lap times
  const times: number[] = []
  lines.forEach((line) => {
    const ms = parseLapTimeToMs(line.trim())
    if (ms != null && ms > 1000) times.push(ms)
  })
  if (times.length >= 2) {
    const laps = times.map((ms, i) => {
      const lap = synthLap(ms, i + 3)
      lap.index = i
      return lap
    })
    return {
      ok: true,
      kind: 'csv',
      laps,
      channels: { speed: true, rpm: true, lapTimes: true },
      message: `Parsed ${laps.length} lap times (charts use synthetic speed/RPM).`,
      fileName,
    }
  }

  return {
    ok: false,
    kind: 'csv',
    laps: [],
    channels,
    message: 'Could not find lap times or speed/RPM columns. Export a Race Studio 3 CSV with Lap/Time/Speed/RPM.',
    fileName,
    needsCsvFallback: true,
  }
}

function findCol(header: string[], aliases: string[]): number {
  for (const a of aliases) {
    const i = header.findIndex((h) => h === a || h.includes(a))
    if (i >= 0) return i
  }
  return -1
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      q = !q
      continue
    }
    if ((c === ',' || c === ';' || c === '\t') && !q) {
      out.push(cur)
      cur = ''
      continue
    }
    cur += c
  }
  out.push(cur)
  return out
}

/** Accept 62.140, 1:02.140, 1:02.1400 (trim to ms), 62000 */
export function parseLapTimeToMs(raw: string | undefined): number | null {
  if (raw == null) return null
  const s = String(raw).trim()
  if (!s) return null
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = Number(s)
    if (n > 10000) return Math.round(n) // already ms
    if (n > 20 && n < 300) return Math.round(n * 1000) // seconds
    return null
  }
  const m = s.match(/^(\d+):(\d{1,2})\.(\d{1,4})$/)
  if (m) {
    const min = Number(m[1])
    const sec = Number(m[2])
    let frac = m[3]
    // normalize to 3 digits (fix 1:01.1000 → 1:01.100)
    if (frac.length > 3) frac = frac.slice(0, 3)
    while (frac.length < 3) frac += '0'
    return min * 60000 + sec * 1000 + Number(frac)
  }
  const m2 = s.match(/^(\d+):(\d{1,2})$/)
  if (m2) return Number(m2[1]) * 60000 + Number(m2[2]) * 1000
  return null
}

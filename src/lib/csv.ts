import type { LapData, ParseResult, TelemetrySample } from './types'
export type { ParseResult }
import { synthLap, withDistanceFromSpeed } from './telemetry'
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

const LAP_ALIASES = ['lap number', 'lap_number', 'lapnumber', 'lap #', 'lap#', 'lap']
const LAP_TIME_ALIASES = [
  'lap time',
  'lap_time',
  'laptime',
  'total time',
  'totaltime',
  'lap time (s)',
]
const SESSION_TIME_ALIASES = ['time (s)', 'time']
const SPEED_ALIASES = [
  'gps speed',
  'gps_speed',
  'gpsspeed',
  'vehicle speed',
  'vehiclespeed',
  'velocity',
  'speed',
  'spd',
]
const RPM_ALIASES = ['engine rpm', 'engine_rpm', 'enginerpm', 'rpm']
const DIST_ALIASES = [
  'gps distance',
  'gps_distance',
  'distance',
  'dist',
  'meters',
  'metres',
]
/** Sector / split timing — recognized; used on lap-summary rows when present */
const SECTOR_ALIASES = [
  'sector 1',
  'sector 2',
  'sector 3',
  'sector 4',
  'sector1',
  'sector2',
  'sector3',
  'sector4',
  'split 1',
  'split 2',
  'split 3',
  'split 4',
  's1',
  's2',
  's3',
  's4',
]
/** Temp / misc channels N10 does not coach on — recognized so they are not “silently dropped” */
const UNUSED_ALIASES = [
  'water temp',
  'water_temp',
  'watert',
  'water t',
  'egt',
  'cht',
  'oilp',
  'oil p',
  'oil pressure',
  'oil temp',
  'thrpos',
  'throttle',
  'brake',
  'gear',
  'lonacc',
  'latacc',
  'gps latitude',
  'gps longitude',
  'gps lat',
  'gps lon',
  'altitude',
]

const ALL_MAPPED_ALIAS_GROUPS = [
  LAP_ALIASES,
  LAP_TIME_ALIASES,
  SESSION_TIME_ALIASES,
  SPEED_ALIASES,
  RPM_ALIASES,
  DIST_ALIASES,
  SECTOR_ALIASES,
  UNUSED_ALIASES,
]

export function parseCsvText(text: string, fileName = 'session.csv'): ParseResult {
  const rawLines = text.split(/\r?\n/)
  const lines = rawLines.filter((l) => l.trim().length)
  if (lines.length < 1) {
    return {
      ok: false,
      kind: 'csv',
      laps: [],
      channels: { speed: false, rpm: false, lapTimes: false },
      message: 'CSV looks empty.',
      fileName,
    }
  }

  const headerInfo = findHeaderRow(lines)
  if (!headerInfo) {
    // Path C fallback: bare list of lap times (no header)
    const bare = tryBareLapTimes(lines, fileName)
    if (bare) return bare
    return {
      ok: false,
      kind: 'csv',
      laps: [],
      channels: { speed: false, rpm: false, lapTimes: false },
      message:
        'Could not find a CSV header row. Export Race Studio CSV with Lap/Time/Speed/RPM/Distance columns (metadata rows above the table are OK).',
      fileName,
      needsCsvFallback: true,
    }
  }

  const { headerLineIndex, header, originalHeaders } = headerInfo
  const dataLines = lines.slice(headerLineIndex + 1).filter((l) => !isUnitsRow(splitCsvLine(l)))

  const lapIdx = findCol(header, LAP_ALIASES)
  const lapTimeIdx = findCol(header, LAP_TIME_ALIASES)
  const sessionTimeIdx =
    lapTimeIdx >= 0 ? findColExcluding(header, SESSION_TIME_ALIASES, [lapTimeIdx]) : findCol(header, SESSION_TIME_ALIASES)
  const timeIdx = lapTimeIdx >= 0 ? lapTimeIdx : sessionTimeIdx
  const speedIdx = findCol(header, SPEED_ALIASES)
  const rpmIdx = findCol(header, RPM_ALIASES)
  const distIdx = findCol(header, DIST_ALIASES)
  const sectorCols = findSectorCols(header, originalHeaders)
  const recognizedUnused = findRecognizedUnused(header, originalHeaders, [
    lapIdx,
    timeIdx,
    sessionTimeIdx,
    speedIdx,
    rpmIdx,
    distIdx,
    ...sectorCols.map((s) => s.idx),
  ])
  const mappedIdx = new Set(
    [lapIdx, lapTimeIdx, sessionTimeIdx, speedIdx, rpmIdx, distIdx, ...sectorCols.map((s) => s.idx)].filter(
      (i) => i >= 0
    )
  )
  // Also mark unused-recognized as mapped (not unmapped)
  for (const u of recognizedUnused) mappedIdx.add(u.idx)

  const unmappedColumns = originalHeaders
    .map((name, i) => ({ name, i }))
    .filter(({ name, i }) => name.trim() && !mappedIdx.has(i) && !isBlankish(name))
    .map(({ name }) => name.trim())

  const channels = {
    speed: speedIdx >= 0,
    rpm: rpmIdx >= 0,
    lapTimes: timeIdx >= 0 || lapIdx >= 0,
  }

  const unusedNames = recognizedUnused.map((u) => u.name)
  const sectorNames = sectorCols.map((s) => s.name)

  function annotate(msg: string): { message: string; unmappedColumns?: string[]; recognizedUnused?: string[] } {
    const bits: string[] = [msg]
    if (sectorNames.length) bits.push(`sectors recognized: ${sectorNames.join(', ')}`)
    if (unusedNames.length) bits.push(`noted (not coached): ${unusedNames.join(', ')}`)
    if (unmappedColumns.length) bits.push(`unmapped columns: ${unmappedColumns.join(', ')}`)
    return {
      message: bits.join(' · '),
      unmappedColumns: unmappedColumns.length ? unmappedColumns : undefined,
      recognizedUnused: unusedNames.length ? unusedNames : undefined,
    }
  }

  // Path A: one row per lap with lap times (no speed stream)
  if (timeIdx >= 0 && speedIdx < 0) {
    const laps: LapData[] = []
    dataLines.forEach((line, i) => {
      const cols = splitCsvLine(line)
      const raw = cols[timeIdx]
      const ms = parseLapTimeToMs(raw)
      if (ms != null && ms > 1000) {
        const lap = synthLap(ms, i + 1)
        lap.index = laps.length
        if (sectorCols.length) {
          const sectors = sectorCols
            .map((s) => parseLapTimeToMs(cols[s.idx]))
            .filter((v): v is number => v != null && v > 0)
          if (sectors.length) lap.sectorLossMs = sectors
        }
        laps.push(lap)
      }
    })
    if (laps.length) {
      return {
        ok: true,
        kind: 'csv',
        laps,
        channels: { ...channels, speed: true, rpm: true },
        fileName,
        ...annotate(
          `Parsed ${laps.length} laps from lap-time CSV (synthetic speed/RPM for charts).`
        ),
      }
    }
  }

  // Path B: sample stream with lap markers (AiM Race Studio channels-vs-time)
  if (speedIdx >= 0 || rpmIdx >= 0) {
    const byLap = new Map<number, TelemetrySample[]>()
    let autoLap = 1
    let lastLap = -1
    let lastDist: number | null = null
    dataLines.forEach((line, row) => {
      const cols = splitCsvLine(line)
      let lapNo = lapIdx >= 0 ? parseNum(cols[lapIdx]) : null
      if (lapNo == null || !Number.isFinite(lapNo)) {
        lapNo = autoLap
        if (distIdx >= 0) {
          const d = parseNum(cols[distIdx])
          if (d != null && lastDist != null && d < 20 && lastDist > 50) {
            autoLap++
            lapNo = autoLap
          }
          if (d != null) lastDist = d
        }
      } else if (lapNo !== lastLap && lastLap >= 0) {
        // lap column advanced
      }
      lastLap = lapNo

      const speed = speedIdx >= 0 ? parseNum(cols[speedIdx]) ?? 0 : 60
      const rpm = rpmIdx >= 0 ? parseNum(cols[rpmIdx]) ?? 5000 : 5000
      const distRaw = distIdx >= 0 ? parseNum(cols[distIdx]) : null
      const sessionT =
        sessionTimeIdx >= 0 ? parseNum(cols[sessionTimeIdx]) : lapTimeIdx < 0 && timeIdx >= 0 ? parseNum(cols[timeIdx]) : null

      const arr = byLap.get(lapNo) ?? []
      const t =
        sessionT != null
          ? sessionT
          : arr.length
            ? arr[arr.length - 1].t + 0.1
            : 0
      arr.push({
        t,
        dist: distRaw != null ? distRaw : arr.length,
        speed,
        rpm,
      })
      byLap.set(lapNo, arr)
    })

    const laps: LapData[] = []
    for (const [lapNo, samples] of [...byLap.entries()].sort((a, b) => a[0] - b[0])) {
      if (samples.length < 5) continue
      const t0 = samples[0].t
      const withRelT = samples.map((s) => ({ ...s, t: Math.max(0, s.t - t0) }))
      const maxD = Math.max(...withRelT.map((s) => s.dist), 1)
      const norm = withRelT.map((s, i) => ({
        ...s,
        dist: distIdx >= 0 ? s.dist / maxD : i / Math.max(1, withRelT.length - 1),
      }))
      const duration = norm[norm.length - 1].t
      const finalMs =
        duration >= 20
          ? Math.round(duration * 1000)
          : Math.round((norm.length / 180) * 62000)
      const scaled = norm.map((s) => ({
        ...s,
        t: duration >= 20 ? s.t : s.dist * (finalMs / 1000),
      }))
      const rpms = scaled.map((s) => s.rpm)
      const speeds = scaled.map((s) => s.speed)
      const withDist = distIdx < 0 && speedIdx >= 0 && duration >= 20 ? withDistanceFromSpeed(scaled) : scaled
      laps.push({
        index: laps.length,
        lapNumber: lapNo,
        timeMs: finalMs,
        samples: withDist,
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
        fileName,
        ...annotate(
          `Parsed ${laps.length} laps · speed ${channels.speed ? 'yes' : 'no'} · RPM ${channels.rpm ? 'yes' : 'no'}.`
        ),
      }
    }
  }

  const bare = tryBareLapTimes(lines, fileName)
  if (bare) return bare

  return {
    ok: false,
    kind: 'csv',
    laps: [],
    channels,
    fileName,
    needsCsvFallback: true,
    ...annotate(
      'Could not find lap times or speed/RPM columns. Export a Race Studio 3 CSV with Lap/Time/Speed/RPM/Distance.'
    ),
  }
}

function tryBareLapTimes(lines: string[], fileName: string): ParseResult | null {
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
  return null
}

function findHeaderRow(
  lines: string[]
): { headerLineIndex: number; header: string[]; originalHeaders: string[] } | null {
  for (let i = 0; i < lines.length; i++) {
    const originalHeaders = splitCsvLine(lines[i]).map((h) => h.trim())
    if (originalHeaders.length < 2) continue
    if (looksLikeMetadata(lines[i], originalHeaders)) continue
    if (isUnitsRow(originalHeaders)) continue
    const header = originalHeaders.map((h) => h.toLowerCase().trim())
    const hits = countAliasHits(header)
    if (hits >= 2) {
      // Prefer a following data/units row that is not another metadata blob
      return { headerLineIndex: i, header, originalHeaders }
    }
    // Single strong hit (e.g. only "Lap Time") can still be a lap-summary header
    if (hits === 1 && (findCol(header, LAP_TIME_ALIASES) >= 0 || findCol(header, SPEED_ALIASES) >= 0)) {
      return { headerLineIndex: i, header, originalHeaders }
    }
  }
  return null
}

function countAliasHits(header: string[]): number {
  let n = 0
  for (const group of ALL_MAPPED_ALIAS_GROUPS) {
    if (findCol(header, group) >= 0) n++
  }
  return n
}

function looksLikeMetadata(line: string, cols: string[]): boolean {
  const lower = line.toLowerCase()
  if (/^(file\s*type|aim\s+race|vehicle\s*:|driver\s*:|track\s*:|date\s*:|session\s*:)/i.test(line.trim())) {
    return true
  }
  if (cols.length <= 2 && /:/.test(line) && !/lap|speed|rpm|time/i.test(lower)) return true
  // "Vehicle: Kart, Driver: Sam, Track: Mosport, Date: ..." single-row metadata
  if (/vehicle\s*:|driver\s*:|track\s*:|beacon\s*:/i.test(line) && findCol(cols.map((c) => c.toLowerCase()), SPEED_ALIASES) < 0) {
    return true
  }
  return false
}

function isUnitsRow(cols: string[]): boolean {
  const nonEmpty = cols.filter((c) => c.trim())
  if (nonEmpty.length < 2) return false
  const unitish = nonEmpty.filter((c) => {
    const t = c.trim().toLowerCase().replace(/^\(|\)$/g, '')
    return (
      /^(s|ms|min|sec|seconds?|km\/h|mph|m\/s|rpm|m|ft|km|deg|°c|°f|c|f|%|g|bar|psi|v|on\/off|unitless)$/i.test(
        t
      ) || /^\([^)]+\)$/.test(c.trim())
    )
  })
  return unitish.length >= Math.ceil(nonEmpty.length * 0.6)
}

function isBlankish(name: string): boolean {
  return !name.trim() || /^column\s*\d+$/i.test(name.trim())
}

function findSectorCols(
  header: string[],
  original: string[]
): { idx: number; name: string }[] {
  const out: { idx: number; name: string }[] = []
  const seen = new Set<number>()
  for (const a of SECTOR_ALIASES) {
    const i = findCol(header, [a])
    if (i >= 0 && !seen.has(i)) {
      seen.add(i)
      out.push({ idx: i, name: original[i] || a })
    }
  }
  // Also match /^s\d+$/ or /^sector\s*\d+/ exactly on header cells
  header.forEach((h, i) => {
    if (seen.has(i)) return
    if (/^(s|sector|split)\s*\d+$/i.test(h.replace(/[_\-]/g, ' ').trim())) {
      seen.add(i)
      out.push({ idx: i, name: original[i] || h })
    }
  })
  return out.sort((a, b) => a.idx - b.idx)
}

function findRecognizedUnused(
  header: string[],
  original: string[],
  already: number[]
): { idx: number; name: string }[] {
  const taken = new Set(already.filter((i) => i >= 0))
  const out: { idx: number; name: string }[] = []
  for (const a of UNUSED_ALIASES) {
    const i = findCol(header, [a])
    if (i >= 0 && !taken.has(i)) {
      taken.add(i)
      out.push({ idx: i, name: original[i] || a })
    }
  }
  return out
}

function findCol(header: string[], aliases: string[]): number {
  // Prefer exact match, then includes
  for (const a of aliases) {
    const exact = header.findIndex((h) => h === a || h.replace(/\s*\([^)]*\)\s*/g, '').trim() === a)
    if (exact >= 0) return exact
  }
  for (const a of aliases) {
    const i = header.findIndex((h) => h.includes(a))
    if (i >= 0) return i
  }
  return -1
}

function findColExcluding(header: string[], aliases: string[], exclude: number[]): number {
  const skip = new Set(exclude)
  for (const a of aliases) {
    const exact = header.findIndex(
      (h, i) => !skip.has(i) && (h === a || h.replace(/\s*\([^)]*\)\s*/g, '').trim() === a)
    )
    if (exact >= 0) return exact
  }
  for (const a of aliases) {
    const i = header.findIndex((h, idx) => !skip.has(idx) && h.includes(a))
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
    if (frac.length > 3) frac = frac.slice(0, 3)
    while (frac.length < 3) frac += '0'
    return min * 60000 + sec * 1000 + Number(frac)
  }
  const m2 = s.match(/^(\d+):(\d{1,2})$/)
  if (m2) return Number(m2[1]) * 60000 + Number(m2[2]) * 1000
  return null
}

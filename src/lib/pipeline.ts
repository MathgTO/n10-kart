/**
 * Import → session draft → (setup step) → re-score. Pure functions (no React) so the smoke scripts run them too.
 */
import { getTrack, saveCustomTrack } from '@/data/tracks'
import { DEFAULT_CLASS, getClassConfig } from './classConfig'
import { driverForSerial, lastDriverAtTrack } from './drivers'
import { buildCoachingReport, pickBestFlyingLap, pickCompareLap, resolveCompareLap } from './scoring'
import { sampleSetup } from './samples'
import { canonicalLabel, sessionStartUtc, shortDate } from './sessionLabel'
import { resolveSessionTime, resolveZone } from './sessionTime'
import { buildSetupVerdict, setupOf, type SetupVerdict } from './setupVerdict'
import { buildDriverSummary, type DriverSummary } from './summary'
import { detectInputFromMeta, detectTrack } from './trackDetect'
import { lastUsedLayout, resolveFromDetection } from './layoutRegistry'
import type { DriverBaseline, DriverProfile, ParseResult, SeriesTag, SessionSetup, StoredSession, TrackInfo } from './types'

export interface ImportContext {
  sessions: StoredSession[]
  drivers: DriverProfile[]
  series: SeriesTag
  /** Last track used (low-confidence fallback only). */
  fallbackTrackId: string
}

export interface ImportResult {
  session: StoredSession
  /** Serial present but bound to nobody → ask once "whose is it?". */
  needsDriverPrompt: boolean
}

/** This driver's latest earlier session at the same track + layout + class (strictly per driver). */
export function previousFor(s: StoredSession, all: StoredSession[]): StoredSession | null {
  const me = sessionStartUtc(s) ?? s.createdAt
  const sameLayout = (x: StoredSession) => {
    // Apple-to-apple: both must share a layout id. Missing layout → not comparable for vs-last deltas.
    if (!s.layoutId || !x.layoutId) return false
    return x.layoutId === s.layoutId
  }
  return (
    all
      .filter(
        (x) =>
          x.id !== s.id &&
          !x.isDemo === !s.isDemo &&
          (x.driverId ?? '') === (s.driverId ?? '') &&
          x.trackId === s.trackId &&
          sameLayout(x) &&
          (x.classId ?? DEFAULT_CLASS) === (s.classId ?? DEFAULT_CLASS) &&
          (sessionStartUtc(x) ?? x.createdAt) < me
      )
      .sort((a, b) => (sessionStartUtc(b) ?? b.createdAt).localeCompare(sessionStartUtc(a) ?? a.createdAt))[0] ?? null
  )
}

/** Prior session at same track+class but different layout (soft-flag for UI). */
export function previousDifferentLayout(s: StoredSession, all: StoredSession[]): StoredSession | null {
  const me = sessionStartUtc(s) ?? s.createdAt
  return (
    all
      .filter(
        (x) =>
          x.id !== s.id &&
          !x.isDemo === !s.isDemo &&
          (x.driverId ?? '') === (s.driverId ?? '') &&
          x.trackId === s.trackId &&
          (x.classId ?? DEFAULT_CLASS) === (s.classId ?? DEFAULT_CLASS) &&
          !!s.layoutId &&
          !!x.layoutId &&
          x.layoutId !== s.layoutId &&
          (sessionStartUtc(x) ?? x.createdAt) < me
      )
      .sort((a, b) => (sessionStartUtc(b) ?? b.createdAt).localeCompare(sessionStartUtc(a) ?? a.createdAt))[0] ?? null
  )
}

export function baselineFor(s: StoredSession, drivers: DriverProfile[]): DriverBaseline | undefined {
  const d = drivers.find((x) => x.id === s.driverId)
  const at = sessionStartUtc(s)
  const candidates = (d?.baselines ?? []).filter(
    (b) => b.trackId === s.trackId && b.classId === (s.classId ?? DEFAULT_CLASS) && (!b.atUtc || (at != null && at > b.atUtc)),
  )
  if (s.layoutId) {
    const same = candidates.find((b) => b.layoutId === s.layoutId)
    if (same) return same
    // No layout-tagged baseline for this config — do not silently mix across layouts
    if (candidates.some((b) => b.layoutId)) return undefined
  }
  return candidates[0]
}

/** Setup prefill: last session for the same driver + track + class (else the driver's baseline sprocket). */
export function prefillSetup(s: StoredSession, all: StoredSession[], drivers: DriverProfile[]): { prefill: SessionSetup; from: StoredSession | null } {
  const prev = previousFor(s, all)
  if (prev) {
    const p = setupOf(prev)
    return { prefill: { ...p, hotPsi: undefined, intentionalChange: undefined, notes: undefined }, from: prev }
  }
  const b = baselineFor(s, drivers)
  return { prefill: { rearTeeth: b?.rearTeeth, tireCompound: getClassConfig(s.classId).defaultTire }, from: null }
}

/** Re-score: report → setup verdict → (if the kart explains exits) report again with D4 confounded. */
export function rescoreSession(s: StoredSession, all: StoredSession[], drivers: DriverProfile[]): StoredSession {
  const prev = previousFor(s, all)
  const track = getTrack(s.trackId)
  const build = (exitsConfounded: boolean) => {
    const bestLapIndex = pickBestFlyingLap(s.laps)
    const compareIdx = resolveCompareLap(s.laps, s.referenceLapIndex, bestLapIndex)
    const { report, corners } = buildCoachingReport({
      sessionId: s.id,
      track: track.name,
      classAssumption: getClassConfig(s.classId).label,
      classId: s.classId,
      series: s.series,
      conditions: s.weather?.wet ? 'wet' : s.conditions,
      laps: s.laps,
      referenceLapIndex: compareIdx,
      cornerNames: track.corners.map((c) => c.name),
      previousSession: prev,
      speedSource: s.sourceKind === 'xrk' || s.sourceKind === 'xrz' ? 'gps' : undefined,
      exitsConfounded,
    })
    return {
      ...s,
      bestLapIndex,
      referenceLapIndex: compareIdx,
      classAssumption: getClassConfig(s.classId).label,
      corners,
      report,
      activePriorityDimensionId: report.priority_dimension_id,
      activePriorityDrillId: report.primary_drill.id,
    } as StoredSession
  }
  const first = build(false)
  const verdict = buildSetupVerdict(first, prev, baselineFor(first, drivers))
  return verdict.exitsConfounded ? build(true) : first
}

export interface Analysis {
  verdict: SetupVerdict
  summary: DriverSummary
  label: string
  previous: StoredSession | null
  driver?: DriverProfile
}

/** The single-source objects for a session: setup verdict (→ teal card + tuner voice) and driver summary (→ school card, driver voice, share). */
export function analyzeSession(s: StoredSession, all: StoredSession[], drivers: DriverProfile[]): Analysis {
  const previous = previousFor(s, all)
  const driver = drivers.find((d) => d.id === s.driverId)
  const verdict = buildSetupVerdict(s, previous, baselineFor(s, drivers))
  const label = canonicalLabel(s, all)
  const summary = buildDriverSummary({ session: s, driver, verdict, label, date: shortDate(s), previous })
  return { verdict, summary, label, previous, driver }
}

/** Build a stored session from a parse (track detect, GPS time + zone, driver binding, class, setup prefill). */
export async function createSessionFromParse(parse: ParseResult, fileName: string, ctx: ImportContext): Promise<ImportResult> {
  const meta = parse.meta
  const detection = detectTrack(detectInputFromMeta(meta))
  let track: TrackInfo
  let detectConfidence: StoredSession['detectConfidence'] = detection.confidence
  if (detection.trackId && detection.confidence !== 'low') {
    track = getTrack(detection.trackId)
  } else if (detection.trackId && detection.confidence === 'low') {
    track = getTrack(detection.trackId)
  } else if (detection.confidence === 'none' && detection.centroid) {
    // Unknown venue: keep the session on 'other' until the user saves a new track from the GPS centroid.
    track = getTrack('other')
  } else {
    track = getTrack(ctx.fallbackTrackId)
    detectConfidence = 'low'
  }

  const { tz, tzSource } = await resolveZone(track.id === 'other' ? null : track, detection.centroid ?? meta?.sf)
  const t = resolveSessionTime(meta, tz)

  // Driver binding is permanent for a serial: bound → reuse (never re-prompt / never overwrite name on import);
  // unknown serial → prompt once; no serial (CSV) → lastDriverAtTrack only if that driver still exists, else unbound.
  const serial = meta?.loggerSerial
  const bound = driverForSerial(ctx.drivers, serial)
  let driverId: string | undefined
  let driverSource: StoredSession['driverSource']
  let needsDriverPrompt = false
  if (bound) {
    driverId = bound.id
    driverSource = 'logger'
  } else if (serial != null) {
    needsDriverPrompt = true
  } else {
    const lastId = lastDriverAtTrack(ctx.sessions, track.id)
    if (lastId && ctx.drivers.some((d) => d.id === lastId)) {
      driverId = lastId
      driverSource = 'last_at_track'
    }
    // else leave unbound — never invent Gabriel
  }
  const driver = ctx.drivers.find((d) => d.id === driverId)

  const bestLapIndex = pickBestFlyingLap(parse.laps)
  const compareLapIndex = pickCompareLap(parse.laps, bestLapIndex)
  const id = `import-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const sample = sampleSetup(fileName)
  const draft: StoredSession = {
    id,
    createdAt: new Date().toISOString(),
    title: '',
    series: ctx.series,
    conditions: 'dry',
    trackId: track.id,
    trackName: track.name,
    // GPS → Layout N registry (not stock GP/National names). Unknown → leave blank (Layout?).
    layoutId: (() => {
      const resolved = resolveFromDetection(track.id, detection)
      if (resolved) return resolved.id
      const last = lastUsedLayout(track.id, ctx.sessions)
      // Prefer last-used only when GPS gave a venue but no layout signature
      if (last && detection.trackId && detection.layoutId == null && detection.lapLengthM == null) return last.id
      return undefined
    })(),
    detectConfidence,
    detection,
    classId: driver?.classDefault ?? DEFAULT_CLASS,
    classAssumption: getClassConfig(driver?.classDefault ?? DEFAULT_CLASS).label,
    sourceFileName: fileName,
    sourceKind: parse.kind === 'unknown' ? 'csv' : parse.kind,
    laps: parse.laps,
    referenceLapIndex: compareLapIndex,
    bestLapIndex,
    corners: [],
    // Placeholder replaced by rescoreSession below.
    report: undefined as unknown as StoredSession['report'],
    activePriorityDimensionId: 'D18',
    activePriorityDrillId: 'reference_naming',
    driverId,
    driverSource,
    logger: {
      serial,
      model: meta?.loggerModel,
      rawDate: meta?.loggerDate,
      rawTime: meta?.loggerTime,
      hwReg: meta?.hwReg,
    },
    startUtc: t.startUtc,
    timeZone: tz,
    tzSource,
    dateSource: t.dateSource,
    dayOffset: t.dayOffset,
    hourMismatch: t.hourMismatch,
    setupConfirmed: false,
  }
  // Class: this driver's last session at this track keeps its class.
  const prevSame = previousFor(draft, ctx.sessions)
  if (prevSame?.classId) {
    draft.classId = prevSame.classId
    draft.classAssumption = getClassConfig(prevSame.classId).label
  }
  // Setup: owner-confirmed sample setup, else prefill from last session (same driver + track + class).
  const { prefill } = prefillSetup(draft, ctx.sessions, ctx.drivers)
  draft.setup = sample ? { ...prefill, ...sample } : prefill
  draft.gearing = { rearTeeth: draft.setup.rearTeeth, frontTeeth: draft.setup.frontTeeth }
  const session = rescoreSession(draft, ctx.sessions, ctx.drivers)
  return { session, needsDriverPrompt }
}

/** "New track" from the GPS centroid (local, user-owned). */
export async function createTrackFromDetection(name: string, s: StoredSession): Promise<TrackInfo | null> {
  const c = s.detection?.centroid
  if (!c) return null
  const { tz } = await resolveZone(null, c)
  const id = `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}-${Date.now().toString(36)}`
  const t: TrackInfo = {
    id,
    name,
    short: name.split(/\s+/).slice(0, 2).join(' '),
    region: 'Custom',
    location: `${c.lat.toFixed(4)}, ${c.lon.toFixed(4)}`,
    corners: getTrack('other').corners,
    lat: c.lat,
    lon: c.lon,
    radiusM: 600,
    tz,
    aimNames: s.detection?.trkName ? [s.detection.trkName] : [],
    layouts: [
      {
        id: 'main',
        name: 'Main',
        lengthM: s.detection?.lapLengthM ?? 1000,
        direction: s.detection?.direction ?? 'ccw',
        measured: s.detection?.lapLengthM != null,
      },
    ],
    custom: true,
  }
  saveCustomTrack(t)
  return t
}

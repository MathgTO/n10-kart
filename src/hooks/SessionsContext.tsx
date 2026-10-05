import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { buildDemoSessions, DEMO_IDS } from '@/data/demos'
import { getTrack } from '@/data/tracks'
import { classIdFromLegacy, getClassConfig } from '@/lib/classConfig'
import { parseSessionFile, type ParseResult } from '@/lib/csv'
import { bindLogger as bindLoggerList, GABRIEL_ID, loadDrivers, saveDrivers, unbindLogger as unbindLoggerList } from '@/lib/drivers'
import { analyzeSession, createSessionFromParse, rescoreSession, type Analysis } from '@/lib/pipeline'
import { findSample, sampleSetup } from '@/lib/samples'
import { sessionStartUtc } from '@/lib/sessionLabel'
import { loadFavorites, loadPrefs, loadSessions, saveFavorites, savePrefs, saveSessions, type Prefs } from '@/lib/storage'
import type { DriverProfile, SeriesTag, SessionSetup, StoredSession, WeatherSnapshot } from '@/lib/types'

/** Bump when scoring / labels / class logic change → stored sessions migrate + re-score once. */
const REPORT_V = 'redesign-oct5-v1'

/** Fields the setup step and the label editor can change (all re-score). */
export type SessionMetaPatch = Partial<
  Pick<
    StoredSession,
    | 'startUtc'
    | 'timeZone'
    | 'tzSource'
    | 'dateSource'
    | 'dayOffset'
    | 'dateFixUndone'
    | 'driverId'
    | 'driverSource'
    | 'trackId'
    | 'layoutId'
    | 'classId'
    | 'series'
    | 'conditions'
    | 'weather'
    | 'shareOptIn'
    | 'detectConfidence'
  >
>

interface SessionsCtx {
  sessions: StoredSession[]
  drivers: DriverProfile[]
  prefs: Prefs
  favorites: string[]
  setSeries: (s: SeriesTag) => void
  toggleFavorite: (id: string) => void
  loadDemos: () => void
  /** Parse → draft session (setup not confirmed yet). Caller navigates to /session/:id/setup. */
  importFile: (file: File) => Promise<{ session: StoredSession | null; parse: ParseResult; needsDriverPrompt: boolean; alreadyImported?: boolean }>
  updateReferenceLap: (sessionId: string, lapIndex: number) => void
  /** Setup step save: setup + class + weather → re-score (the only way setup changes). */
  saveSetup: (sessionId: string, setup: SessionSetup, opts?: { classId?: string; weather?: WeatherSnapshot | null; series?: SeriesTag }) => void
  updateSessionMeta: (sessionId: string, patch: SessionMetaPatch) => void
  /** Assign a driver to a session; optionally bind this logger serial to them for future imports. */
  assignDriver: (sessionId: string, driverId: string, bind: boolean) => void
  upsertDriver: (d: DriverProfile) => void
  deleteDriver: (id: string) => void
  unbindLogger: (serial: number) => void
  attachVideo: (sessionId: string, file: File) => void
  deleteSession: (id: string) => void
  getSession: (id: string) => StoredSession | undefined
  analyze: (s: StoredSession) => Analysis
  storageFull: boolean
}

const Ctx = createContext<SessionsCtx | null>(null)

const byStart = (a: StoredSession, b: StoredSession) =>
  (sessionStartUtc(a) ?? a.createdAt).localeCompare(sessionStartUtc(b) ?? b.createdAt)

/** Legacy → current shape: class id, driver, GPS start for bundled samples, setup from gearing. */
function migrate(s: StoredSession): StoredSession {
  let out: StoredSession = { ...s }
  if (!out.classId) out.classId = classIdFromLegacy(out.classAssumption)
  out.classAssumption = getClassConfig(out.classId).label
  const sample = findSample(out.sourceFileName)
  if (sample) {
    out.sourceFileName = sample.displayName
    if (!out.startUtc) {
      out.startUtc = sample.gpsStartUtc
      out.dateSource = 'gps'
      out.timeZone = getTrack(out.trackId).tz
      out.tzSource = 'track'
    }
    if (!out.setup) out.setup = sampleSetup(out.sourceFileName)
    if (out.setupConfirmed == null) out.setupConfirmed = true
    if (out.trackId === 'mosport' && !out.layoutId) out.layoutId = 'gp'
    if (!out.logger) out.logger = { serial: 35023763, model: 'MyChron 6' }
  }
  if (!out.isDemo && !out.driverId) {
    out.driverId = GABRIEL_ID
    out.driverSource = out.driverSource ?? 'migrated'
  }
  if (out.isDemo) {
    // Demos always teach Junior Light (blue .520 / 6150 / Vega White) — never yellow Junior.
    out.classId = 'junior_light'
    out.classAssumption = getClassConfig('junior_light').label
    out.layoutId = out.layoutId ?? 'gp'
    out.setup = { tireCompound: getClassConfig('junior_light').defaultTire, rearTeeth: 67, ...out.setup }
    out.setupConfirmed = true
  }
  if (!out.setup && out.gearing) out.setup = { rearTeeth: out.gearing.rearTeeth, frontTeeth: out.gearing.frontTeeth }
  if (out.setupConfirmed == null) out.setupConfirmed = true
  if (!out.startUtc) {
    const st = sessionStartUtc(out)
    if (st && !out.isDemo) {
      out.startUtc = st
      out.dateSource = out.dateSource ?? 'logger'
    }
  }
  // Old title overrides (file names / 'Mosport · Oct 3 …') are never displayed again.
  out.title = ''
  delete (out as Partial<StoredSession>).recordedAt
  return out
}

function rescoreAll(list: StoredSession[], drivers: DriverProfile[]): StoredSession[] {
  const chrono = [...list].sort(byStart)
  const done: StoredSession[] = []
  for (const s of chrono) done.push(rescoreSession(s, done, drivers))
  return done.sort((a, b) => byStart(b, a))
}

export function SessionsProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<StoredSession[]>([])
  const [drivers, setDrivers] = useState<DriverProfile[]>(loadDrivers())
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs())
  const [favorites, setFavorites] = useState<string[]>(loadFavorites())
  const [ready, setReady] = useState(false)
  const [storageFull, setStorageFull] = useState(false)
  const sessionsRef = useRef<StoredSession[]>([])
  sessionsRef.current = sessions
  const driversRef = useRef<DriverProfile[]>(drivers)
  driversRef.current = drivers

  useEffect(() => {
    const existing = loadSessions()
    if (existing.length && prefs.reportVersion !== REPORT_V) {
      setSessions(rescoreAll(existing.map(migrate), drivers))
    } else {
      setSessions(existing.sort((a, b) => byStart(b, a)))
    }
    setPrefs((p) => ({
      ...p,
      reportVersion: REPORT_V,
      demosLoaded: existing.some((s) => DEMO_IDS.includes(s.id as (typeof DEMO_IDS)[number])),
    }))
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot hydrate
  }, [])

  useEffect(() => {
    if (!ready) return
    setStorageFull(!saveSessions(sessions))
  }, [sessions, ready])
  useEffect(() => {
    savePrefs(prefs)
  }, [prefs])
  useEffect(() => {
    saveFavorites(favorites)
  }, [favorites])
  useEffect(() => {
    saveDrivers(drivers)
  }, [drivers])

  const setSeries = useCallback((s: SeriesTag) => setPrefs((p) => ({ ...p, series: s })), [])
  const toggleFavorite = useCallback(
    (id: string) => setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])),
    []
  )

  const loadDemos = useCallback(() => {
    const demos = buildDemoSessions().map(migrate)
    setSessions((prev) => {
      const without = prev.filter((s) => !DEMO_IDS.includes(s.id as (typeof DEMO_IDS)[number]))
      return [...rescoreAll(demos, driversRef.current), ...without].sort((a, b) => byStart(b, a))
    })
    setPrefs((p) => ({ ...p, demosLoaded: true }))
  }, [])

  /** Replace one session (re-scored) and re-score this driver's later sessions at the same track (their "vs last" moves). */
  const commit = useCallback((next: StoredSession, list: StoredSession[]): StoredSession[] => {
    const ds = driversRef.current
    const others = list.filter((x) => x.id !== next.id)
    const scored = rescoreSession(next, others, ds)
    let out = [scored, ...others]
    const later = out.filter(
      (x) => x.id !== scored.id && x.driverId === scored.driverId && x.trackId === scored.trackId && byStart(x, scored) > 0
    )
    for (const l of later.sort(byStart)) {
      const r = rescoreSession(l, out.filter((x) => x.id !== l.id), ds)
      out = out.map((x) => (x.id === l.id ? r : x))
    }
    return out.sort((a, b) => byStart(b, a))
  }, [])

  const importFile = useCallback(async (file: File) => {
    const lower = file.name.toLowerCase()
    const isText = lower.endsWith('.csv') || lower.endsWith('.txt')
    const payload: ArrayBuffer | string = isText ? await file.text() : await file.arrayBuffer()

    let importHash: string | undefined
    try {
      const bytes = typeof payload === 'string' ? new TextEncoder().encode(payload) : new Uint8Array(payload)
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const dig = await crypto.subtle.digest('SHA-256', bytes)
        importHash = [...new Uint8Array(dig)].map((b) => b.toString(16).padStart(2, '0')).join('')
      }
    } catch {
      importHash = undefined
    }

    const parse = await parseSessionFile(file, payload)
    if (!parse.ok || !parse.laps.length) return { session: null, parse, needsDriverPrompt: false }

    // Fast path: same file hash already in the library.
    if (importHash) {
      const byHash = sessionsRef.current.find((s) => !s.isDemo && s.importHash === importHash)
      if (byHash) return { session: byHash, parse, needsDriverPrompt: false, alreadyImported: true }
    }

    const { session, needsDriverPrompt } = await createSessionFromParse(parse, file.name, {
      sessions: sessionsRef.current,
      drivers: driversRef.current,
      series: prefs.series,
      fallbackTrackId: prefs.trackId || 'mosport',
    })
    if (importHash) session.importHash = importHash

    // Logger serial + startUtc — same outing imported twice under different names.
    const byLogger = sessionsRef.current.find(
      (s) =>
        !s.isDemo &&
        session.logger?.serial != null &&
        s.logger?.serial === session.logger.serial &&
        !!session.startUtc &&
        s.startUtc === session.startUtc,
    )
    if (byLogger) return { session: byLogger, parse, needsDriverPrompt: false, alreadyImported: true }

    setSessions((list) => [session, ...list].sort((a, b) => byStart(b, a)))
    setPrefs((p) => ({ ...p, trackId: session.trackId }))
    return { session, parse, needsDriverPrompt }
  }, [prefs.series, prefs.trackId])

  const updateReferenceLap = useCallback(
    (sessionId: string, lapIndex: number) => {
      setSessions((list) => {
        const s = list.find((x) => x.id === sessionId)
        return s ? commit({ ...s, referenceLapIndex: lapIndex }, list) : list
      })
    },
    [commit]
  )

  const saveSetup = useCallback<SessionsCtx['saveSetup']>(
    (sessionId, setup, opts) => {
      setSessions((list) => {
        const s = list.find((x) => x.id === sessionId)
        if (!s) return list
        const next: StoredSession = {
          ...s,
          setup,
          setupConfirmed: true,
          gearing: { rearTeeth: setup.rearTeeth, frontTeeth: setup.frontTeeth },
          classId: opts?.classId ?? s.classId,
          series: opts?.series ?? s.series,
          weather: opts?.weather === null ? undefined : opts?.weather ?? s.weather,
          conditions: (opts?.weather ?? s.weather)?.wet ? 'wet' : s.conditions === 'wet' && opts?.weather === null ? 'dry' : s.conditions,
        }
        return commit(next, list)
      })
    },
    [commit]
  )

  const updateSessionMeta = useCallback(
    (sessionId: string, patch: SessionMetaPatch) => {
      setSessions((list) => {
        const s = list.find((x) => x.id === sessionId)
        if (!s) return list
        const next = { ...s, ...patch }
        if (patch.trackId) next.trackName = getTrack(patch.trackId).name
        return commit(next, list)
      })
    },
    [commit]
  )

  const assignDriver = useCallback(
    (sessionId: string, driverId: string, bind: boolean) => {
      const s = sessionsRef.current.find((x) => x.id === sessionId)
      const serial = s?.logger?.serial
      if (bind && serial != null) setDrivers((ds) => bindLoggerList(ds, driverId, serial, s?.logger?.model))
      const d = driversRef.current.find((x) => x.id === driverId)
      updateSessionMeta(sessionId, {
        driverId,
        driverSource: bind && serial != null ? 'logger' : 'manual',
        classId: s?.setupConfirmed ? s.classId : d?.classDefault ?? s?.classId,
      })
    },
    [updateSessionMeta]
  )

  const upsertDriver = useCallback((d: DriverProfile) => {
    setDrivers((ds) => (ds.some((x) => x.id === d.id) ? ds.map((x) => (x.id === d.id ? d : x)) : [...ds, d]))
  }, [])
  const deleteDriver = useCallback((id: string) => {
    setDrivers((ds) => ds.filter((x) => x.id !== id))
    setSessions((list) => list.map((s) => (s.driverId === id ? { ...s, driverId: undefined, driverSource: undefined } : s)))
  }, [])
  const unbindLogger = useCallback((serial: number) => setDrivers((ds) => unbindLoggerList(ds, serial)), [])

  /** The clip is only played back next to the data: it is not analyzed and does not change the report. */
  const attachVideo = useCallback((sessionId: string, file: File) => {
    const url = URL.createObjectURL(file)
    setSessions((list) =>
      list.map((s) => {
        if (s.id !== sessionId) return s
        if (s.videoObjectUrl) URL.revokeObjectURL(s.videoObjectUrl)
        return { ...s, videoName: file.name, videoObjectUrl: url, videoCueMarkers: undefined }
      })
    )
  }, [])

  const deleteSession = useCallback((id: string) => setSessions((list) => list.filter((s) => s.id !== id)), [])
  const getSession = useCallback((id: string) => sessions.find((s) => s.id === id), [sessions])
  const analyze = useCallback((s: StoredSession) => analyzeSession(s, sessions, drivers), [sessions, drivers])

  const value = useMemo(
    () => ({
      sessions,
      drivers,
      prefs,
      favorites,
      setSeries,
      toggleFavorite,
      loadDemos,
      importFile,
      updateReferenceLap,
      saveSetup,
      updateSessionMeta,
      assignDriver,
      upsertDriver,
      deleteDriver,
      unbindLogger,
      attachVideo,
      deleteSession,
      getSession,
      analyze,
      storageFull,
    }),
    [sessions, drivers, prefs, favorites, setSeries, toggleFavorite, loadDemos, importFile, updateReferenceLap, saveSetup, updateSessionMeta, assignDriver, upsertDriver, deleteDriver, unbindLogger, attachVideo, deleteSession, getSession, analyze, storageFull]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSessions() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSessions outside provider')
  return v
}

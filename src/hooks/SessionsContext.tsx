import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { buildDemoSessions, DEMO_IDS } from '@/data/demos'
import { getTrack } from '@/data/tracks'
import { buildCoachingReport, pickBestFlyingLap, refreshStoredSession } from '@/lib/scoring'
import {
  loadFavorites,
  loadPrefs,
  loadSessions,
  saveFavorites,
  savePrefs,
  saveSessions,
  type Prefs,
} from '@/lib/storage'
import type { LapData, SeriesTag, StoredSession } from '@/lib/types'
import { parseSessionFile, type ParseResult } from '@/lib/csv'

interface SessionsCtx {
  sessions: StoredSession[]
  prefs: Prefs
  favorites: string[]
  setTrackId: (id: string) => void
  setSeries: (s: SeriesTag) => void
  toggleFavorite: (id: string) => void
  loadDemos: () => void
  importFile: (file: File, opts?: { trackId?: string }) => Promise<{ session: StoredSession | null; parse: ParseResult }>
  updateReferenceLap: (sessionId: string, lapIndex: number) => void
  attachVideo: (sessionId: string, file: File) => void
  deleteSession: (id: string) => void
  getSession: (id: string) => StoredSession | undefined
}

const Ctx = createContext<SessionsCtx | null>(null)

export function SessionsProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<StoredSession[]>([])
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs())
  const [favorites, setFavorites] = useState<string[]>(loadFavorites())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const existing = loadSessions()
    const LANG_V = 'turn-sector-v1'
    const REPORT_V = 'na-null-v1'
    const needsLang = prefs.langVersion !== LANG_V
    const needsReport = prefs.reportVersion !== REPORT_V
    // First visit / empty library: stay empty until the user explicitly loads demos.
    if (existing.length === 0) {
      setSessions([])
      setPrefs((p) => ({
        ...p,
        demosLoaded: false,
        langVersion: LANG_V,
        reportVersion: REPORT_V,
      }))
    } else if (needsLang || needsReport) {
      // Recompute reports for stored sessions when scoring or coach vocabulary changes.
      // Keep any demos already stored, but do not inject them automatically.
      // Sort oldest→newest so previousSession chain is stable, then restore newest-first.
      const chrono = [...existing].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      const refreshed: StoredSession[] = []
      for (const s of chrono) {
        const prev = refreshed.length ? refreshed[refreshed.length - 1] : null
        const names = getTrack(s.trackId).corners.map((c) => c.name)
        refreshed.push(refreshStoredSession(s, prev, names))
      }
      refreshed.reverse()
      setSessions(refreshed)
      setPrefs((p) => ({
        ...p,
        demosLoaded: existing.some((s) =>
          DEMO_IDS.includes(s.id as (typeof DEMO_IDS)[number])
        ),
        langVersion: LANG_V,
        reportVersion: REPORT_V,
      }))
    } else {
      setSessions(existing)
    }
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot hydrate
  }, [])

  useEffect(() => {
    if (!ready) return
    saveSessions(sessions)
  }, [sessions, ready])

  useEffect(() => {
    savePrefs(prefs)
  }, [prefs])

  useEffect(() => {
    saveFavorites(favorites)
  }, [favorites])

  const setTrackId = useCallback((id: string) => {
    setPrefs((p) => ({ ...p, trackId: id }))
  }, [])

  const setSeries = useCallback((s: SeriesTag) => {
    setPrefs((p) => ({ ...p, series: s }))
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))
  }, [])

  const loadDemos = useCallback(() => {
    const demos = buildDemoSessions()
    setSessions((prev) => {
      const without = prev.filter((s) => !DEMO_IDS.includes(s.id as (typeof DEMO_IDS)[number]))
      return [...demos, ...without]
    })
    setPrefs((p) => ({ ...p, demosLoaded: true }))
  }, [])

  const previousFor = useCallback(
    (list: StoredSession[], excludeId?: string) => {
      const sorted = [...list]
        .filter((s) => s.id !== excludeId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      return sorted[0] ?? null
    },
    []
  )

  const importFile = useCallback(
    async (file: File, opts?: { trackId?: string }) => {
      const lower = file.name.toLowerCase()
      let payload: string | ArrayBuffer
      if (lower.endsWith('.csv') || lower.endsWith('.txt')) {
        payload = await file.text()
      } else {
        payload = await file.arrayBuffer()
      }
      const parse = await parseSessionFile(file, payload)
      if (!parse.ok || !parse.laps.length) {
        return { session: null, parse }
      }
      const track = getTrack(opts?.trackId ?? prefs.trackId)
      const bestLapIndex = pickBestFlyingLap(parse.laps)
      const ordered = parse.laps
        .map((l, i) => ({ i, t: l.timeMs }))
        .sort((a, b) => a.t - b.t)
      const compareLapIndex = ordered[1]?.i ?? bestLapIndex
      const id = `import-${Date.now()}`
      const series = prefs.series
      const prev = previousFor(sessions)
      const { report, corners } = buildCoachingReport({
        sessionId: id,
        track: track.name,
        classAssumption: 'LO206 Junior',
        series,
        conditions: 'dry',
        laps: parse.laps,
        referenceLapIndex: compareLapIndex,
        cornerNames: track.corners.map((c) => c.name),
        channels: parse.channels,
        previousSession: prev,
      })
      const session: StoredSession = {
        id,
        createdAt: new Date().toISOString(),
        title: file.name.replace(/\.(csv|xrz|xrk)$/i, ''),
        series,
        conditions: 'dry',
        trackId: track.id,
        trackName: track.name,
        classAssumption: 'LO206 Junior',
        sourceFileName: file.name,
        sourceKind: parse.kind === 'unknown' ? 'csv' : parse.kind,
        laps: parse.laps,
        referenceLapIndex: compareLapIndex,
        bestLapIndex,
        corners,
        report,
        activePriorityDimensionId: report.priority_dimension_id,
        activePriorityDrillId: report.primary_drill.id,
      }
      setSessions((prevList) => [session, ...prevList])
      return { session, parse }
    },
    [prefs.trackId, prefs.series, sessions, previousFor]
  )

  const updateReferenceLap = useCallback((sessionId: string, lapIndex: number) => {
    setSessions((list) =>
      list.map((s) => {
        if (s.id !== sessionId) return s
        const prev = previousFor(list, sessionId)
        const { report, corners } = buildCoachingReport({
          sessionId: s.id,
          track: s.trackName,
          classAssumption: s.classAssumption,
          series: s.series,
          conditions: s.conditions,
          laps: s.laps,
          referenceLapIndex: lapIndex,
          cornerNames: getTrack(s.trackId).corners.map((c) => c.name),
          hasVideo: !!s.videoName,
          previousSession: prev,
        })
        return {
          ...s,
          referenceLapIndex: lapIndex,
          corners,
          report,
          activePriorityDimensionId: report.priority_dimension_id,
          activePriorityDrillId: report.primary_drill.id,
        }
      })
    )
  }, [previousFor])

  const attachVideo = useCallback((sessionId: string, file: File) => {
    const url = URL.createObjectURL(file)
    setSessions((list) =>
      list.map((s) => {
        if (s.id !== sessionId) return s
        const prev = previousFor(list, sessionId)
        const { report, corners } = buildCoachingReport({
          sessionId: s.id,
          track: s.trackName,
          classAssumption: s.classAssumption,
          series: s.series,
          conditions: s.conditions,
          laps: s.laps,
          referenceLapIndex: s.referenceLapIndex,
          cornerNames: getTrack(s.trackId).corners.map((c) => c.name),
          hasVideo: true,
          previousSession: prev,
        })
        return {
          ...s,
          videoName: file.name,
          videoObjectUrl: url,
          corners,
          report,
          activePriorityDimensionId: report.priority_dimension_id,
          activePriorityDrillId: report.primary_drill.id,
          videoCueMarkers: report.top_weaknesses.slice(0, 3).map((w, i) => ({
            t: 30 + i * 25,
            label: w.cue,
          })),
        }
      })
    )
  }, [previousFor])

  const deleteSession = useCallback((id: string) => {
    setSessions((list) => list.filter((s) => s.id !== id))
  }, [])

  const getSession = useCallback(
    (id: string) => sessions.find((s) => s.id === id),
    [sessions]
  )

  const value = useMemo(
    () => ({
      sessions,
      prefs,
      favorites,
      setTrackId,
      setSeries,
      toggleFavorite,
      loadDemos,
      importFile,
      updateReferenceLap,
      attachVideo,
      deleteSession,
      getSession,
    }),
    [
      sessions,
      prefs,
      favorites,
      setTrackId,
      setSeries,
      toggleFavorite,
      loadDemos,
      importFile,
      updateReferenceLap,
      attachVideo,
      deleteSession,
      getSession,
    ]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSessions() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSessions outside provider')
  return v
}

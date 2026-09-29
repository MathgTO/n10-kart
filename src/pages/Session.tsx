import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CornerCards } from '@/components/CornerCards'
import { TrackMap } from '@/components/TrackMap'
import { ExitRpmBand } from '@/components/ExitRpmBand'
import { FocusHero, StickyFocusBar } from '@/components/FocusHero'
import { ImportModal } from '@/components/ImportModal'
import { OverlayCharts } from '@/components/OverlayCharts'
import { ScorePanel } from '@/components/ScorePanel'
import { HealthDiagnostic } from '@/components/HealthDiagnostic'
import { VideoPanel } from '@/components/VideoPanel'
import { VsLastStrip } from '@/components/VsLastStrip'
import { useSessions } from '@/hooks/SessionsContext'
import { formatLapLabel, formatLapTime } from '@/lib/format'
import { SAFETY_LINE, seriesLabel } from '@/lib/labels'
import { lapValidity } from '@/lib/telemetry'
import { getTrack } from '@/data/tracks'
import { MOSPORT_GP_SECTORS } from '@/data/mosportSectors'

export function SessionPage() {
  const { id } = useParams()
  const { getSession, updateReferenceLap, deleteSession } = useSessions()
  const session = id ? getSession(id) : undefined
  const nav = useNavigate()
  const [importOpen, setImportOpen] = useState(false)
  const [selectedSectorIndex, setSelectedSectorIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!session) return
    setSelectedSectorIndex(session.report.focus.sectorIndex ?? 0)
  }, [session?.id])

  if (!session) {
    return (
      <div className="panel text-center py-12">
        <p className="text-lg">Session not found.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">
          Home
        </Link>
      </div>
    )
  }

  const best = session.laps[session.bestLapIndex]
  const ref = session.laps[session.referenceLapIndex]
  const track = getTrack(session.trackId)
  const cornerLabels = MOSPORT_GP_SECTORS.map((s) => ({ name: s.code, at: s.midFrac }))
  const validity = lapValidity(session.laps)
  const hasCompare = session.referenceLapIndex !== session.bestLapIndex

  return (
    <div className="space-y-6 pb-28">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/" className="text-sm text-n10-lime font-semibold">
            ← Sessions
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black">{session.title}</h1>
            {session.isDemo && (
              <span className="rounded-full border border-amber-300/60 bg-amber-300/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-200">
                Demo session
              </span>
            )}
          </div>
          <p className="text-base text-n10-soft">
            {session.classAssumption} · {session.trackName} · {seriesLabel(session.series)}
          </p>
          {session.isDemo && (
            <p className="text-sm text-amber-200/90">
              Demo data generated for illustration, not a real recording. Import your own file to see your laps.
            </p>
          )}
          <p className="mt-1 text-sm font-semibold text-white">{SAFETY_LINE}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-secondary" onClick={() => setImportOpen(true)}>
            Import another
          </button>
          <button
            type="button"
            className="btn-secondary text-red-300"
            onClick={() => {
              if (!window.confirm(`Delete session "${session.title}"?`)) return
              deleteSession(session.id)
              nav('/')
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Single race-video path: empty-state card OR player/replace once */}
      {!session.videoObjectUrl ? (
        <section className="w-full rounded-2xl border-2 border-n10-lime bg-n10-lime/10 py-4 px-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-black text-n10-lime uppercase tracking-wide">Race video</p>
              <p className="text-sm text-n10-soft mt-0.5">
                Add your onboard / kart-cam clip (mp4 or mov) to watch next to the data. It stays on this
                device and isn&apos;t analyzed; the coaching comes from your logger file.
              </p>
            </div>
            <VideoPanel session={session} compact />
          </div>
        </section>
      ) : (
        <VideoPanel session={session} />
      )}

      {/* Compare lap = delta subject; Best ★ stays the target */}
      <section className="panel">
        <h2 className="text-lg font-bold">Compare lap</h2>
        <p className="text-sm text-n10-soft mt-1">
          <span className="text-n10-lime font-semibold">Best ★</span> is the fastest full lap
          (target). Tap a <span className="text-white font-semibold">slower</span> lap to compare
          — delta and Coach call show where that lap lost vs best. Out-laps, in-laps and partial
          laps are greyed out and never compared.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {session.laps.map((lap, i) => {
            const v = validity[i]
            const isBest = i === session.bestLapIndex
            const isCompare = hasCompare && i === session.referenceLapIndex
            const disabled = v !== 'ok' || isBest
            return (
              <button
                key={i}
                type="button"
                disabled={disabled}
                title={v === 'partial' ? 'Partial lap (not compared)' : v === 'slow' ? 'Out-lap or in-lap (not compared)' : undefined}
                onClick={() => updateReferenceLap(session.id, i)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold border ${
                  isCompare
                    ? 'border-sky-400 bg-sky-400 text-black'
                    : isBest
                      ? 'border-n10-lime/60 bg-n10-lime/10 text-n10-lime'
                      : v !== 'ok'
                        ? 'border-n10-border/50 bg-transparent text-n10-mute/60 cursor-not-allowed'
                        : 'border-n10-border bg-n10-card text-n10-soft'
                }`}
              >
                {formatLapLabel(lap, i)} {formatLapTime(lap.timeMs)}
                {isBest ? ' ★ best' : ''}
                {isCompare ? ' · compare' : ''}
                {v === 'partial' ? ' · partial' : v === 'slow' ? ' · out/in' : ''}
              </button>
            )
          })}
        </div>
      </section>

      {/* 1. Focus hero */}
      <FocusHero session={session} />

      {/* 2. Delta + overlay */}
      {best && ref && (
        <OverlayCharts best={best} reference={ref} cornerLabels={cornerLabels} />
      )}

      <ExitRpmBand rpm={session.report.focus.exitRpm ?? best?.exitRpmFocus} />

      {/* 3. Track map + corner cards */}
      <TrackMap
        focusCornerName={session.report.focus.cornerName}
        selectedSectorIndex={selectedSectorIndex}
        onSelectSector={setSelectedSectorIndex}
      />
      <CornerCards
        corners={session.corners}
        selectedSectorIndex={selectedSectorIndex}
        onSelectSector={setSelectedSectorIndex}
      />

      {/* 4. Scores / setup / vs-last */}
      <VsLastStrip
        deltas={session.report.vs_last}
        priorityAdvanced={session.report.priority_advanced}
        priorityDim={session.report.priority_dimension_id}
      />
      <HealthDiagnostic session={session} />
      <ScorePanel report={session.report} />

      {session.report.racecraft_cue && (
        <section className="panel">
          <h2 className="text-xl font-bold">Racecraft cue</h2>
          <p className="mt-2 text-base text-n10-soft">{session.report.racecraft_cue}</p>
        </section>
      )}

      <StickyFocusBar report={session.report} />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}

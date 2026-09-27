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
import { formatLapTime } from '@/lib/format'
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

  return (
    <div className="space-y-6 pb-28">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/" className="text-sm text-n10-lime font-semibold">
            ← Sessions
          </Link>
          <h1 className="text-2xl font-black mt-1">{session.title}</h1>
          <p className="text-base text-n10-soft">
            {session.classAssumption} · {session.trackName} · {session.series}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={() => setImportOpen(true)}>
            Import another
          </button>
          <button
            type="button"
            className="btn-secondary text-red-300"
            onClick={() => {
              deleteSession(session.id)
              nav('/')
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Compare lap = delta subject; Best ★ stays the target */}
      <section className="panel">
        <h2 className="text-lg font-bold">Compare lap</h2>
        <p className="text-sm text-n10-soft mt-1">
          <span className="text-n10-lime font-semibold">Best ★</span> is the fastest flying lap
          (target). Tap a <span className="text-white font-semibold">slower</span> lap to compare
          — delta and Coach call show where that lap lost vs best.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {session.laps.map((lap, i) => (
            <button
              key={i}
              type="button"
              onClick={() => updateReferenceLap(session.id, i)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold border ${
                i === session.referenceLapIndex
                  ? 'border-sky-400 bg-sky-400 text-black'
                  : 'border-n10-border bg-n10-card text-n10-soft'
              }`}
            >
              L{i + 1} {formatLapTime(lap.timeMs)}
              {i === session.bestLapIndex ? ' ★ best' : ''}
              {i === session.referenceLapIndex && i !== session.bestLapIndex ? ' · compare' : ''}
            </button>
          ))}
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
      <VideoPanel session={session} />

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

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CoachDims } from '@/components/CoachDims'
import { CornerCards } from '@/components/CornerCards'
import { CornerExitsDetail } from '@/components/CornerExitsDetail'
import { HealthDiagnostic } from '@/components/HealthDiagnostic'
import { ImportModal } from '@/components/ImportModal'
import { OverlayCharts } from '@/components/OverlayCharts'
import { SchoolCard } from '@/components/SchoolCard'
import { SetupCard } from '@/components/SetupCard'
import { TrackMap } from '@/components/TrackMap'
import { VideoPanel } from '@/components/VideoPanel'
import { VoicePlayer } from '@/components/VoicePlayer'
import { GradeDeltaStrip } from '@/components/GradeDeltaStrip'
import { VsLastStrip } from '@/components/VsLastStrip'
import { MOSPORT_GP_SECTORS } from '@/data/mosportSectors'
import { getTrack } from '@/data/tracks'
import { useSessions } from '@/hooks/SessionsContext'
import { getClassConfig } from '@/lib/classConfig'
import { formatLapLabel, formatLapTime } from '@/lib/format'
import { SAFETY_LINE } from '@/lib/labels'
import { shareReportCardPdf } from '@/lib/reportPdf'
import { rubric } from '@/lib/rubric'
import { sessionLocal } from '@/lib/sessionLabel'
import { lapValidity } from '@/lib/telemetry'

export function SessionPage() {
  const { id } = useParams()
  const { getSession, updateReferenceLap, deleteSession, updateSessionMeta, analyze } = useSessions()
  const session = id ? getSession(id) : undefined
  const nav = useNavigate()
  const [importOpen, setImportOpen] = useState(false)
  const [shareBusy, setShareBusy] = useState(false)
  const [shareToast, setShareToast] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [view, setView] = useState<'driver' | 'coach'>('driver')
  const [deepOpen, setDeepOpen] = useState(false)
  const [selectedSectorIndex, setSelectedSectorIndex] = useState<number | null>(null)
  const a = useMemo(() => (session ? analyze(session) : null), [session, analyze])

  useEffect(() => {
    if (!session) return
    setSelectedSectorIndex(session.report.focus.sectorIndex ?? 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id])

  // Coach view opens deep dive; Driver view keeps it collapsed by default.
  useEffect(() => {
    if (view === 'coach') setDeepOpen(true)
    else setDeepOpen(false)
  }, [view])

  if (!session || !a) {
    return (
      <div className="panel py-12 text-center">
        <p className="text-lg">Session not found.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">
          Sessions
        </Link>
      </div>
    )
  }

  const { verdict, summary, label, driver } = a
  const best = session.laps[session.bestLapIndex]
  const ref = session.laps[session.referenceLapIndex]
  const cls = getClassConfig(session.classId)
  const cornerLabels = MOSPORT_GP_SECTORS.map((s) => ({ name: s.code, at: s.midFrac }))
  const validity = lapValidity(session.laps)
  const hasCompare = session.referenceLapIndex !== session.bestLapIndex
  const kidCard = driver ? driver.kidCard : true
  const title = driver ? summary.title : 'Report card'
  const drill = rubric.drills.find((d) => d.id === session.report.primary_drill.id)
  const showDeep = view === 'coach' || deepOpen

  const focusLine = summary.start.text
  const kartLine =
    verdict.category !== 'none'
      ? `${verdict.categoryLabel}: ${verdict.action}`
      : verdict.action

  const onShare = async () => {
    if (shareBusy) return
    setShareBusy(true)
    setShareToast(null)
    try {
      const firstShare = !session.shareOptIn
      if (firstShare) updateSessionMeta(session.id, { shareOptIn: true })
      const track = getTrack(session.trackId)
      const local = sessionLocal(session)
      const dateLabel = local
        ? `${local.monthShort} ${local.day}${local.year ? `, ${local.year}` : ''}`
        : undefined
      const result = await shareReportCardPdf(summary, {
        trackLabel: track.name,
        dateLabel,
        classLabel: getClassConfig(session.classId).label,
      })
      if (firstShare) {
        setShareToast('Private — driving report only. Nothing leaves this device until you send the PDF.')
      } else if (result === 'saved') {
        setShareToast('PDF saved on this device — attach it from Files / Downloads.')
      } else if (result === 'shared') {
        setShareToast(null)
      }
    } catch {
      setShareToast('Couldn’t prepare the PDF. Try again.')
    } finally {
      setShareBusy(false)
    }
  }

  return (
    <div className="space-y-5 pb-28">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to="/" className="no-print inline-flex min-h-[44px] items-center text-sm font-semibold text-n10-lime">
            ← Sessions
          </Link>
          <p className="text-sm text-n10-soft">{label}</p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black">{title}</h1>
            {session.isDemo && <span className="rounded-full border border-amber-300/60 bg-amber-300/10 px-2.5 py-0.5 text-sm font-bold uppercase text-amber-200">Demo</span>}
          </div>
        </div>
        <div className="relative no-print shrink-0">
          <button type="button" className="btn-secondary min-h-[48px] min-w-[48px]" aria-label="More" onClick={() => setMenuOpen((v) => !v)}>
            ⋯
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-30 mt-2 w-48 rounded-xl border border-n10-border bg-n10-panel p-2 shadow-xl">
              <Link to={`/session/${session.id}/setup`} className="block min-h-[44px] rounded-lg px-3 py-2 font-semibold text-white hover:bg-n10-card" onClick={() => setMenuOpen(false)}>
                Edit setup
              </Link>
              <button
                type="button"
                className="block min-h-[44px] w-full rounded-lg px-3 py-2 text-left font-semibold text-rose-300 hover:bg-n10-card"
                onClick={() => {
                  setMenuOpen(false)
                  if (!window.confirm(`Delete ${label}?`)) return
                  deleteSession(session.id)
                  nav('/')
                }}
              >
                Delete session
              </button>
            </div>
          )}
        </div>
      </header>

      {session.isDemo && <p className="text-sm text-amber-200/90">Demo data generated for illustration, not a real recording.</p>}

      {/* Before next round — one driver focus + one kart line */}
      {view === 'driver' && (
        <section className="rounded-2xl border border-n10-lime/50 bg-n10-lime/5 p-4 sm:p-5">
          <p className="text-sm font-bold uppercase tracking-wide text-n10-lime">Before next round</p>
          <div className="mt-3 space-y-3">
            <div className="rounded-xl border border-n10-border bg-n10-card/80 p-3">
              <p className="text-sm font-bold text-n10-lime">Driver</p>
              <p className="mt-1 text-base font-semibold text-white leading-snug">{focusLine}</p>
            </div>
            <div className="rounded-xl border border-n10-teal/40 bg-n10-teal/5 p-3">
              <p className="text-sm font-bold text-n10-teal">Kart · Tuner</p>
              <p className="mt-1 text-base font-semibold text-white leading-snug">{kartLine}</p>
            </div>
          </div>
        </section>
      )}

      <div className="no-print grid grid-cols-2 gap-1 rounded-2xl border border-n10-border bg-n10-panel p-1" role="tablist">
        {(['driver', 'coach'] as const).map((v) => (
          <button key={v} type="button" role="tab" aria-selected={view === v} className={`min-h-[48px] rounded-xl font-semibold ${view === v ? 'bg-n10-lime text-black' : 'text-n10-soft'}`} onClick={() => setView(v)}>
            {v === 'driver' ? 'Driver view' : 'Coach view'}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-n10-border bg-n10-panel px-4 py-3">
        {best && (
          <p className="mr-2 text-white">
            <span className="font-semibold">★ Best lap {summary.bestLap?.lapNumber}</span> <span className="text-xl font-black">{formatLapTime(best.timeMs)}</span>
            {summary.compareLap && (
              <span className="text-sm text-n10-soft">
                {' '}
                vs lap {summary.compareLap.lapNumber} {formatLapTime(summary.compareLap.ms)} · +{(summary.compareLap.deltaMs / 1000).toFixed(3)}
              </span>
            )}
          </p>
        )}
        {summary.gpsOnly && <span className="rounded-full border border-n10-border bg-n10-card px-3 py-1 text-sm font-semibold text-n10-soft">GPS speed only</span>}
        <span className="rounded-full border border-n10-border bg-n10-card px-3 py-1 text-sm font-semibold text-n10-soft">
          {cls.label}
          {cls.limiter ? ` · ${cls.limiter}` : ''}
        </span>
      </div>

      <GradeDeltaStrip current={session} previous={a.previous} />

      {view === 'driver' ? (
        <SchoolCard summary={summary}>
          {/* Driver view: single driver VoicePlayer only */}
          <VoicePlayer label={`Voice for ${summary.name === 'Driver' ? 'driver' : summary.name}`} script={summary.voiceScript} tone="lime" />
        </SchoolCard>
      ) : (
        <CoachDims report={session.report} />
      )}

      {/* Setup card always visible; tuner voice only on Coach / SetupCard path */}
      <SetupCard
        verdict={verdict}
        sessionId={session.id}
        confirmed={session.setupConfirmed !== false}
        kid={kidCard}
        showTunerVoice={view === 'coach'}
      />

      {view === 'coach' && (
        <>
          <HealthDiagnostic session={session} />
          <div className="grid gap-3 sm:grid-cols-2 no-print">
            <VoicePlayer label="Voice for driver" script={summary.voiceScript} tone="lime" />
            <VoicePlayer label="Voice for tuner" script={verdict.voiceScript} tone="teal" />
          </div>
        </>
      )}

      {/* Deep dive: collapsed by default on Driver view; open on Coach */}
      {view === 'driver' && !deepOpen && (
        <button type="button" className="no-print btn-secondary min-h-[48px] w-full" onClick={() => setDeepOpen(true)}>
          Show deep dive
        </button>
      )}

      {showDeep && (
        <div className="no-print space-y-5">
          <div className="flex items-center justify-between gap-2 pt-2">
            <h2 className="text-lg font-bold text-n10-soft">Deep dive</h2>
            {view === 'driver' && (
              <button type="button" className="text-sm font-semibold text-n10-mute underline" onClick={() => setDeepOpen(false)}>
                Hide
              </button>
            )}
          </div>

          <section className="panel">
            <h2 className="text-lg font-bold">Compare laps</h2>
            <p className="mt-1 text-sm text-n10-soft">
              <span className="font-semibold text-n10-lime">Best ★</span> is the target. Tap a slower full lap to compare. Out/in and partial laps are never compared.
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
                    onClick={() => updateReferenceLap(session.id, i)}
                    className={`min-h-[44px] rounded-lg border px-3 text-sm font-semibold ${
                      isCompare ? 'border-sky-400 bg-sky-400 text-black' : isBest ? 'border-n10-lime/60 bg-n10-lime/10 text-n10-lime' : v !== 'ok' ? 'cursor-not-allowed border-n10-border/50 text-n10-mute' : 'border-n10-border bg-n10-card text-n10-soft'
                    }`}
                  >
                    {formatLapLabel(lap, i)} {formatLapTime(lap.timeMs)}
                    {isBest ? ' ★' : ''}
                    {v === 'partial' ? ' · partial' : v === 'slow' ? ' · out/in' : ''}
                  </button>
                )
              })}
            </div>
          </section>

          {session.trackId === 'mosport' && (
            <TrackMap
              focusCornerName={session.report.focus.cornerName}
              selectedSectorIndex={selectedSectorIndex}
              onSelectSector={setSelectedSectorIndex}
              layoutId={session.layoutId}
              onLayoutChange={(layoutId) => updateSessionMeta(session.id, { layoutId })}
            />
          )}
          {best && ref && <OverlayCharts best={best} reference={ref} cornerLabels={cornerLabels} band={cls.peakSpeedBand ?? undefined} floor={cls.cornerExitLowRpm ?? undefined} />}
          <CornerCards corners={session.corners} selectedSectorIndex={selectedSectorIndex} onSelectSector={setSelectedSectorIndex} />
          <CornerExitsDetail session={session} confoundNote={verdict.exitsConfounded ? 'Kart setup is the likely limiter on exits this outing — no exit grade (see the setup card).' : undefined} />
          <VsLastStrip deltas={session.report.vs_last} priorityAdvanced={session.report.priority_advanced} priorityDim={session.report.priority_dimension_id} />

          {session.report.racecraft_cue && (
            <section className="panel">
              <h2 className="text-xl font-bold">Racecraft cue</h2>
              <p className="mt-2 text-base text-n10-soft">{session.report.racecraft_cue}</p>
            </section>
          )}

          {session.videoObjectUrl ? (
            <VideoPanel session={session} />
          ) : (
            <section className="panel flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold">Race video</h2>
                <p className="text-sm text-n10-soft">Play your onboard clip next to the data. It stays on this device and isn’t analyzed.</p>
              </div>
              <VideoPanel session={session} compact />
            </section>
          )}

          <section className="panel">
            <h2 className="text-lg font-bold">Drills</h2>
            {drill && (
              <div className="mt-2 rounded-xl border border-n10-lime/40 bg-n10-lime/5 p-3">
                <p className="font-bold text-n10-lime">This round: {drill.name}</p>
                <p className="text-base text-n10-soft">{drill.instruction}</p>
              </div>
            )}
            <details className="mt-3">
              <summary className="min-h-[32px] cursor-pointer font-semibold text-white">All drills ({rubric.drills.length})</summary>
              <ul className="mt-2 space-y-3">
                {rubric.drills.map((d) => (
                  <li key={d.id}>
                    <p className="font-semibold text-white">{d.name}</p>
                    <p className="text-base text-n10-soft">{d.instruction}</p>
                  </li>
                ))}
              </ul>
            </details>
          </section>

          <p className="text-sm font-semibold text-white">{SAFETY_LINE}</p>
        </div>
      )}

      {/* Sticky bottom: Import another + Share → native PDF sheet directly */}
      <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-n10-border bg-black/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="mx-auto max-w-3xl space-y-2">
          <div className="flex gap-2">
            <button type="button" className="btn-secondary min-h-[48px] flex-1" onClick={() => setImportOpen(true)}>
              Import another
            </button>
            <button
              type="button"
              className="btn-primary min-h-[48px] flex-1"
              disabled={shareBusy}
              onClick={() => void onShare()}
            >
              {shareBusy ? 'Preparing PDF…' : 'Share'}
            </button>
          </div>
          <p className="text-center text-xs text-n10-mute">
            Private — PDF only. Nothing leaves until you send. No setup numbers.
          </p>
          {shareToast && <p className="text-center text-sm text-n10-soft">{shareToast}</p>}
        </div>
      </div>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}

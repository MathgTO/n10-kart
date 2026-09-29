import type { CoachingReport, StoredSession } from '@/lib/types'
import { formatDeltaMs, formatLapLabel, formatLapTime, formatRpm } from '@/lib/format'
import { EXIT_RPM_BAND } from '@/lib/rubric'

export function FocusHero({ session }: { session: StoredSession }) {
  const f = session.report.focus
  const refLap = session.laps[session.referenceLapIndex]
  const bestLap = session.laps[session.bestLapIndex]
  return (
    <section className="panel border-n10-lime/30 bg-gradient-to-b from-n10-lime/10 to-transparent">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold uppercase tracking-wider text-n10-lime">Coach call · Next run</p>
        <p className="text-sm text-n10-soft">
          Compare {formatLapLabel(refLap, session.referenceLapIndex)} {formatLapTime(refLap?.timeMs)} · Best ★{' '}
          {formatLapLabel(bestLap, session.bestLapIndex)} {formatLapTime(bestLap?.timeMs)}
        </p>
      </div>
      <h1 className="mt-2 text-2xl sm:text-3xl font-black text-white leading-tight">
        {f.cornerName}
        <span className="ml-2 text-n10-lime">{formatDeltaMs(f.lossMs)} vs best</span>
      </h1>
      {f.sectorLabel && (
        <p className="mt-1 text-sm text-n10-soft">
          Biggest time loss in timing sector{' '}
          <span className="font-semibold text-white">{f.sectorLabel}</span>
          <span className="text-n10-mute"> — coach call is the turn to fix inside that sector</span>
        </p>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Cue title="Brake" body={f.brake} />
        <Cue title="Apex" body={f.apex} />
        <Cue title="Exit" body={f.exit} />
      </div>
      <div className="mt-4 rounded-xl border border-n10-border bg-black/40 p-4">
        <p className="label-lg text-n10-lime">One primary drill</p>
        <p className="mt-1 text-lg font-bold">{session.report.primary_drill.name}</p>
        <p className="mt-1 text-base text-n10-soft">{session.report.primary_drill.message}</p>
      </div>
      {f.exitRpm != null && (
        <p className="mt-3 text-sm text-n10-soft">
          Focus exit RPM <span className="text-white font-semibold">{formatRpm(f.exitRpm)}</span> ·
          band {EXIT_RPM_BAND.lo}–{EXIT_RPM_BAND.hi} (Junior: gear for yellow-slide peak, not limiter)
        </p>
      )}
    </section>
  )
}

function Cue({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-n10-border bg-n10-card p-3">
      <p className="text-sm font-bold uppercase text-n10-lime">{title}</p>
      <p className="mt-1 text-base text-n10-soft leading-snug">{body}</p>
    </div>
  )
}

export function StickyFocusBar({ report }: { report: CoachingReport }) {
  const f = report.focus
  return (
    <div className="sticky-focus sm:hidden">
      <p className="text-xs font-bold uppercase text-n10-lime">Next run</p>
      <p className="text-sm font-semibold truncate">
        {f.cornerName}
        {f.sectorLabel ? ` · ${f.sectorLabel}` : ''} · {formatDeltaMs(f.lossMs)} ·{' '}
        {report.primary_drill.name}
      </p>
    </div>
  )
}

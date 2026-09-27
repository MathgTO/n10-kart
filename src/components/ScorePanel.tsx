import { useState } from 'react'
import type { CoachingReport, DimensionScore } from '@/lib/types'
import { getDimension, MOSPORT_BIAS, MYCHRON_HONEST, NEEDS_KART_CAM } from '@/lib/rubric'

function fmtComposite(n: number | null | undefined): string {
  return n == null || !Number.isFinite(n) ? 'N/A' : n.toFixed(1)
}

function evidenceLabel(s: DimensionScore): string {
  if (s.unavailable_reason === 'needs_cam') return 'needs cam'
  if (s.unavailable_reason === 'needs_channels') return 'needs channels'
  if (MYCHRON_HONEST.has(s.dimension_id)) return 'MyChron'
  if (NEEDS_KART_CAM.has(s.dimension_id)) {
    return s.evidence_kind === 'needs_kart_cam' ? 'needs cam' : 'kart-cam'
  }
  return 'heuristic'
}

export function ScorePanel({ report }: { report: CoachingReport }) {
  const [open, setOpen] = useState(false)
  const c = report.composites
  return (
    <section className="panel">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div>
          <h2 className="text-xl font-bold">20-dimension scores</h2>
          <p className="text-sm text-n10-soft mt-1">
            Qual {fmtComposite(c.qualifying_pace_index)} · Racecraft {fmtComposite(c.racecraft_index)} ·
            Race win {fmtComposite(c.race_win_index)}
          </p>
        </div>
        <span className="text-n10-lime font-bold">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="mt-4 space-y-2">
          {report.scores.map((s) => {
            const dim = getDimension(s.dimension_id)
            const bias = MOSPORT_BIAS.includes(s.dimension_id)
            const na = s.score == null
            return (
              <div
                key={s.dimension_id}
                className={`grid grid-cols-[3rem_1fr_3rem] gap-2 items-center text-sm ${
                  na ? 'opacity-50' : ''
                }`}
              >
                <span
                  className={`font-mono ${
                    na ? 'text-neutral-500' : bias ? 'text-n10-lime' : 'text-n10-mute'
                  }`}
                >
                  {s.dimension_id}
                </span>
                <div>
                  <div className="flex justify-between gap-2">
                    <span className={`font-medium ${na ? 'text-neutral-400' : ''}`}>
                      {dim?.label ?? s.dimension_id}
                    </span>
                    <span className="text-xs text-n10-mute">{evidenceLabel(s)}</span>
                  </div>
                  <div className={`mt-1 h-2 rounded ${na ? 'bg-neutral-900' : 'bg-neutral-800'}`}>
                    {!na && (
                      <div
                        className="h-2 rounded bg-n10-lime"
                        style={{ width: `${((s.score as number) / 5) * 100}%` }}
                      />
                    )}
                  </div>
                  {s.evidence_markers[0] && (
                    <p className="text-xs text-n10-mute mt-0.5">{s.evidence_markers[0]}</p>
                  )}
                  {na && s.notes && (
                    <p className="text-xs text-neutral-500 mt-0.5">{s.notes}</p>
                  )}
                </div>
                <span
                  className={`text-right font-bold ${na ? 'text-neutral-500' : ''}`}
                  title={na ? s.unavailable_reason ?? 'unavailable' : undefined}
                >
                  {na ? 'N/A' : (s.score as number).toFixed(1)}
                </span>
              </div>
            )
          })}
          <div className="pt-3 border-t border-n10-border">
            <p className="label-lg mb-2">Top 3 weaknesses</p>
            {report.top_weaknesses.length === 0 ? (
              <p className="text-sm text-n10-mute">No scored weaknesses yet — attach cam or channels.</p>
            ) : (
              report.top_weaknesses.map((w) => (
                <p key={w.dimension_id} className="text-sm text-n10-soft py-1">
                  <span className="text-white font-semibold">{w.dimension_id}</span> ({w.score}) —{' '}
                  {w.cue} <span className="text-n10-mute">[{w.marker}]</span>
                </p>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  )
}

import { useState } from 'react'
import type { CoachingReport } from '@/lib/types'
import { getDimension, MOSPORT_BIAS, MYCHRON_HONEST, NEEDS_KART_CAM } from '@/lib/rubric'

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
            Qual {c.qualifying_pace_index.toFixed(1)} · Racecraft {c.racecraft_index.toFixed(1)} ·
            Race win {c.race_win_index.toFixed(1)}
          </p>
        </div>
        <span className="text-n10-lime font-bold">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="mt-4 space-y-2">
          {report.scores.map((s) => {
            const dim = getDimension(s.dimension_id)
            const bias = MOSPORT_BIAS.includes(s.dimension_id)
            return (
              <div
                key={s.dimension_id}
                className="grid grid-cols-[3rem_1fr_3rem] gap-2 items-center text-sm"
              >
                <span className={`font-mono ${bias ? 'text-n10-lime' : 'text-n10-mute'}`}>
                  {s.dimension_id}
                </span>
                <div>
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{dim?.label ?? s.dimension_id}</span>
                    <span className="text-xs text-n10-mute">
                      {MYCHRON_HONEST.has(s.dimension_id)
                        ? 'MyChron'
                        : NEEDS_KART_CAM.has(s.dimension_id)
                          ? s.evidence_kind === 'needs_kart_cam'
                            ? 'needs kart-cam'
                            : 'kart-cam'
                          : 'heuristic'}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded bg-neutral-800">
                    <div
                      className="h-2 rounded bg-n10-lime"
                      style={{ width: `${(s.score / 5) * 100}%` }}
                    />
                  </div>
                  {s.evidence_markers[0] && (
                    <p className="text-xs text-n10-mute mt-0.5">{s.evidence_markers[0]}</p>
                  )}
                </div>
                <span className="text-right font-bold">{s.score.toFixed(1)}</span>
              </div>
            )
          })}
          <div className="pt-3 border-t border-n10-border">
            <p className="label-lg mb-2">Top 3 weaknesses</p>
            {report.top_weaknesses.map((w) => (
              <p key={w.dimension_id} className="text-sm text-n10-soft py-1">
                <span className="text-white font-semibold">{w.dimension_id}</span> ({w.score}) — {w.cue}{' '}
                <span className="text-n10-mute">[{w.marker}]</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

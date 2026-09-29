import { useState } from 'react'
import type { CoachingReport, DimensionScore } from '@/lib/types'
import { getDimension, MOSPORT_BIAS, MYCHRON_HONEST, NEEDS_KART_CAM } from '@/lib/rubric'

function fmtComposite(n: number | null | undefined): string {
  return n == null || !Number.isFinite(n) ? 'N/A' : n.toFixed(1)
}

/** True when this dim should show grey N/A (including legacy localStorage reports). */
export function isUnavailableScore(s: DimensionScore, hasVideo?: boolean): boolean {
  if (s.score == null || !Number.isFinite(s.score)) return true
  if (s.unavailable_reason) return true
  // Pre-N/A reports kept seeded numbers but marked needs_kart_cam
  if (s.evidence_kind === 'needs_kart_cam') return true
  if (hasVideo === false && NEEDS_KART_CAM.has(s.dimension_id)) return true
  return false
}

function evidenceLabel(s: DimensionScore): string {
  if (s.unavailable_reason === 'needs_cam' || s.evidence_kind === 'needs_kart_cam') return 'not from data'
  if (s.unavailable_reason === 'needs_channels') return 'needs channels'
  if (MYCHRON_HONEST.has(s.dimension_id)) return 'MyChron'
  if (NEEDS_KART_CAM.has(s.dimension_id)) {
    return 'kart-cam'
  }
  return 'heuristic'
}

export function ScorePanel({
  report,
  hasVideo,
}: {
  report: CoachingReport
  hasVideo?: boolean
}) {
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
            const na = isUnavailableScore(s, hasVideo)
            return (
              <div
                key={s.dimension_id}
                className={`grid grid-cols-[1fr_3rem] gap-2 items-center text-sm ${
                  na ? 'opacity-50' : ''
                }`}
              >
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
                  {!na && s.evidence_markers[0] && (
                    <p className="text-xs text-n10-mute mt-0.5">{s.evidence_markers[0]}</p>
                  )}
                  {na && (
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {s.notes ??
                        (s.unavailable_reason === 'needs_channels' ||
                        (MYCHRON_HONEST.has(s.dimension_id) && s.evidence_kind !== 'mychron')
                          ? 'Needs MyChron channels.'
                          : 'Not scored from logger data.')}
                    </p>
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
            {report.top_weaknesses.filter((w) => Number.isFinite(w.score)).length === 0 ? (
              <p className="text-sm text-n10-mute">No scored weaknesses yet — this file has no speed or RPM channel.</p>
            ) : (
              report.top_weaknesses
                .filter((w) => Number.isFinite(w.score))
                .map((w) => (
                  <p key={w.dimension_id} className="text-sm text-n10-soft py-1">
                    <span className="text-white font-semibold">{getDimension(w.dimension_id)?.label ?? 'Skill'}</span> ({w.score}) —{' '}
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

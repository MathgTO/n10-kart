import type { CoachingReport, DimensionScore } from '@/lib/types'
import { getDimension } from '@/lib/rubric'
import { dimGrade, gradeRank } from '@/lib/grades'
import { GradeLetter } from './GradeLetter'

function evidenceLabel(s: DimensionScore): string {
  if (s.unavailable_reason === 'needs_cam' || s.evidence_kind === 'needs_kart_cam') return 'needs video'
  if (s.unavailable_reason === 'needs_channels') return 'needs channels'
  if (s.setup_confounded) return `MyChron · ${s.confidence ?? 'medium'} confidence · context`
  if (s.evidence_kind === 'mychron') return 'MyChron'
  if (s.evidence_kind === 'kart_cam') return 'video'
  if (s.evidence_kind === 'heuristic' && s.score != null) return `estimate · ${s.confidence ?? 'low'} confidence`
  return 'no data basis'
}

/** Coach view: same graded-dim set as the kid card. Measured + data-backed estimates get numbers/letters; video-required and no-basis stay N/A. */
export function CoachDims({ report }: { report: CoachingReport }) {
  const rows = [...report.scores].sort((a, b) => gradeRank(dimGrade(a)) - gradeRank(dimGrade(b)))
  return (
    <section className="panel">
      <h2 className="text-xl font-bold">Coach dims</h2>
      <p className="mt-1 text-sm text-n10-soft">
        Numbers 0–5 for MyChron-measured dims and data-backed estimates (speed/RPM/lap times). Video-only dims and dims with no logger basis show N/A.
      </p>
      <ul className="mt-3 divide-y divide-n10-border">
        {rows.map((s) => {
          const dim = getDimension(s.dimension_id)
          const g = dimGrade(s)
          const scored = g.score != null
          return (
            <li key={s.dimension_id} className="grid grid-cols-[3.5rem_1fr_auto] items-start gap-3 py-2.5">
              <span className="font-mono text-sm font-bold text-n10-mute">{s.dimension_id}</span>
              <div className="min-w-0">
                <p className={`font-semibold ${scored ? 'text-white' : 'text-n10-mute'}`}>{dim?.label ?? s.dimension_id}</p>
                <p className="text-sm text-n10-mute">
                  {evidenceLabel(s)}
                  {scored && s.evidence_markers[0] ? ` · ${s.evidence_markers.join(' · ')}` : ''}
                </p>
                {s.notes && <p className="text-sm text-n10-soft">{s.notes}</p>}
              </div>
              <span className="text-right">
                <span className={`block font-bold ${scored ? 'text-white' : 'text-n10-mute'}`}>
                  {scored ? (g.score as number).toFixed(1) : 'N/A'}
                </span>
                {g.letter && (
                  <span className="mt-0.5 flex items-center justify-end gap-1">
                    <GradeLetter letter={g.letter} className="text-n10-lime" size="sm" />
                    {g.status === 'estimate' ? <span className="text-xs font-semibold text-n10-mute">est.</span> : null}
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

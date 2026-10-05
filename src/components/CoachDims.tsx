import type { CoachingReport, DimensionScore } from '@/lib/types'
import { getDimension } from '@/lib/rubric'
import { letterForDim } from '@/lib/grades'
import { isMeasured } from '@/lib/scoring'

function evidenceLabel(s: DimensionScore): string {
  if (s.unavailable_reason === 'needs_cam' || s.evidence_kind === 'needs_kart_cam') return 'needs video'
  if (s.unavailable_reason === 'needs_channels') return 'needs channels'
  if (s.setup_confounded) return `MyChron · ${s.confidence ?? 'medium'} confidence · context`
  if (s.evidence_kind === 'mychron') return 'MyChron'
  if (s.evidence_kind === 'kart_cam') return 'video'
  return 'estimate'
}

/** Coach view: every dimension with its D-id. Numbers/letters only for measured evidence (same honesty as kid card). */
export function CoachDims({ report }: { report: CoachingReport }) {
  const rows = [...report.scores].sort((a, b) => Number(isMeasured(b)) - Number(isMeasured(a)))
  return (
    <section className="panel">
      <h2 className="text-xl font-bold">Coach dims</h2>
      <p className="mt-1 text-sm text-n10-soft">
        Numbers 0–5 only when MyChron/video-measured (not setup-confounded). Heuristic estimates show N/A — never a fake score.
      </p>
      <ul className="mt-3 divide-y divide-n10-border">
        {rows.map((s) => {
          const dim = getDimension(s.dimension_id)
          const measured = isMeasured(s)
          const letter = letterForDim(s)
          return (
            <li key={s.dimension_id} className="grid grid-cols-[3.5rem_1fr_auto] items-start gap-3 py-2.5">
              <span className="font-mono text-sm font-bold text-n10-mute">{s.dimension_id}</span>
              <div className="min-w-0">
                <p className={`font-semibold ${measured ? 'text-white' : 'text-n10-mute'}`}>{dim?.label ?? s.dimension_id}</p>
                <p className="text-sm text-n10-mute">
                  {evidenceLabel(s)}
                  {measured && s.evidence_markers[0] ? ` · ${s.evidence_markers.join(' · ')}` : ''}
                </p>
                {s.notes && <p className="text-sm text-n10-soft">{s.notes}</p>}
              </div>
              <span className="text-right">
                <span className={`block font-bold ${measured ? 'text-white' : 'text-n10-mute'}`}>
                  {measured ? (s.score as number).toFixed(1) : 'N/A'}
                </span>
                {letter && <span className="block text-sm font-bold text-n10-lime">{letter}</span>}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

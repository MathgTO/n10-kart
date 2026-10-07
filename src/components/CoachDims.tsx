import type { CoachingReport, DimensionScore } from '@/lib/types'
import { getDimension, HIDDEN_GRADE_DIMS, NEEDS_KART_CAM } from '@/lib/rubric'
import { dimGrade, gradeRank } from '@/lib/grades'

function evidenceLabel(s: DimensionScore): string | null {
  if (s.unavailable_reason === 'needs_cam' || s.evidence_kind === 'needs_kart_cam') return 'needs video'
  if (s.unavailable_reason === 'needs_channels') return 'needs channels'
  if (s.setup_confounded) return `MyChron · ${s.confidence ?? 'medium'} confidence · context`
  if (s.evidence_kind === 'mychron') return 'MyChron'
  if (s.evidence_kind === 'kart_cam') return 'video'
  if (s.evidence_kind === 'heuristic' && s.score != null) return `estimate · ${s.confidence ?? 'low'} confidence`
  // Never surface "no data basis" — caller hides these rows.
  return null
}

function isVisibleCoachDim(s: DimensionScore): boolean {
  if (HIDDEN_GRADE_DIMS.has(s.dimension_id)) return false
  const g = dimGrade(s)
  if (g.status === 'needs_video') return true
  if (g.status === 'ungraded') {
    // Keep channel-missing cues; drop pure no-basis rows (and dry-only wet dims without video path already covered).
    if (s.unavailable_reason === 'needs_channels') return true
    // Video-set dims always stay visible as "needs video" even if scoring path missed the flag.
    if (NEEDS_KART_CAM.has(s.dimension_id)) return true
    return false
  }
  return true
}

/** Coach view: numbers only (0–5). Video dims grey "needs video"; hidden dims omitted; no fake zeros. */
export function CoachDims({ report }: { report: CoachingReport }) {
  const rows = [...report.scores]
    .filter(isVisibleCoachDim)
    .map((s) => {
      // Normalize video-set dims so the label is always "needs video" when unscored.
      if (NEEDS_KART_CAM.has(s.dimension_id) && (s.score == null || s.evidence_kind === 'needs_kart_cam')) {
        return {
          ...s,
          evidence_kind: 'needs_kart_cam' as const,
          unavailable_reason: 'needs_cam' as const,
        }
      }
      return s
    })
    .sort((a, b) => gradeRank(dimGrade(a)) - gradeRank(dimGrade(b)))

  return (
    <section className="panel">
      <h2 className="text-xl font-bold">Coach grades</h2>
      <p className="mt-1 text-sm text-n10-soft">
        Numbers 0–5 for MyChron-measured dims and data-backed estimates. Video-only dims show N/A · needs video — never a fake zero.
      </p>
      <ul className="mt-3 divide-y divide-n10-border">
        {rows.map((s) => {
          const dim = getDimension(s.dimension_id)
          const g = dimGrade(s)
          const scored = g.score != null
          const label = evidenceLabel(s)
          return (
            <li key={s.dimension_id} className="grid grid-cols-[3.5rem_1fr_auto] items-start gap-3 py-2.5">
              <span className="font-mono text-sm font-bold text-n10-mute">{s.dimension_id}</span>
              <div className="min-w-0">
                <p className={`font-semibold ${scored ? 'text-white' : 'text-n10-mute'}`}>{dim?.label ?? s.dimension_id}</p>
                <p className="text-sm text-n10-mute">
                  {label ?? 'needs video'}
                  {scored && s.evidence_markers[0] ? ` · ${s.evidence_markers.join(' · ')}` : ''}
                </p>
                {s.notes && scored && <p className="text-sm text-n10-soft">{s.notes}</p>}
              </div>
              <span className="text-right">
                <span className={`block font-bold ${scored ? 'text-white' : 'text-n10-mute'}`}>
                  {scored ? (g.score as number).toFixed(1) : 'N/A'}
                </span>
                {g.status === 'estimate' && scored ? (
                  <span className="mt-0.5 block text-xs font-semibold text-n10-mute">est.</span>
                ) : null}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

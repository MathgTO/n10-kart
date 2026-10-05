import type { DimensionScore } from './types'

export type Letter = 'A+' | 'A' | 'A−' | 'B+' | 'B' | 'B−' | 'C+' | 'C' | 'C−' | 'D'

/** School letter from a 0–5 score. null / non-finite → no letter. */
export function letterFromScore(score: number | null | undefined): Letter | null {
  if (score == null || !Number.isFinite(score)) return null
  if (score >= 4.7) return 'A+'
  if (score >= 4.3) return 'A'
  if (score >= 4.0) return 'A−'
  if (score >= 3.7) return 'B+'
  if (score >= 3.3) return 'B'
  if (score >= 3.0) return 'B−'
  if (score >= 2.7) return 'C+'
  if (score >= 2.3) return 'C'
  if (score >= 2.0) return 'C−'
  return 'D'
}

/**
 * How a dimension is graded — the ONE source for both Coach view and the kid/driver report card.
 *  - measured:    MyChron / video measured → number + letter
 *  - estimate:    inferred from MyChron speed/RPM/lap data (lower confidence) → number + letter, tagged "est."
 *  - context:     data-backed number but the kart/setup explains it → number, no letter (never blame the driver)
 *  - needs_video: requires kart-cam / someone watching → grey N/A
 *  - ungraded:    no realistic logger/GPS basis (or missing channels / not applicable) → grey N/A
 */
export type GradeStatus = 'measured' | 'estimate' | 'context' | 'needs_video' | 'ungraded'

export interface DimGrade {
  status: GradeStatus
  score: number | null
  letter: Letter | null
}

export function dimGrade(s: DimensionScore | undefined): DimGrade {
  if (!s) return { status: 'ungraded', score: null, letter: null }
  if (s.unavailable_reason === 'needs_cam' || s.evidence_kind === 'needs_kart_cam') return { status: 'needs_video', score: null, letter: null }
  const score = s.score != null && Number.isFinite(s.score) ? s.score : null
  if (score == null || s.unavailable_reason) return { status: 'ungraded', score: null, letter: null }
  if (s.setup_confounded) return { status: 'context', score, letter: null }
  if (s.evidence_kind === 'mychron' || s.evidence_kind === 'kart_cam') return { status: 'measured', score, letter: letterFromScore(score) }
  return { status: 'estimate', score, letter: letterFromScore(score) }
}

/** Letter for a dimension (measured or data-backed estimate), or null when it needs video / has no data basis / is setup-confounded. */
export function letterForDim(s: DimensionScore | undefined): Letter | null {
  return dimGrade(s).letter
}

/** Display order: lettered first (measured, then estimates), then context, then ungraded / needs video. */
export function gradeRank(g: DimGrade): number {
  return { measured: 0, estimate: 1, context: 2, ungraded: 3, needs_video: 4 }[g.status]
}

/** Mean of measured subjects → one letter (internal: bad-day check; not shown on the card). */
export function overallLetter(scores: number[]): Letter | null {
  if (!scores.length) return null
  return letterFromScore(scores.reduce((a, b) => a + b, 0) / scores.length)
}

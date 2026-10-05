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

/** Letter for a dimension score, or null when it is unmeasured / needs cam / channels / setup-confounded. */
export function letterForDim(s: DimensionScore | undefined): Letter | null {
  if (!s) return null
  if (s.unavailable_reason) return null
  if (s.setup_confounded) return null
  if (s.evidence_kind !== 'mychron' && s.evidence_kind !== 'kart_cam') return null
  return letterFromScore(s.score)
}

/** Mean of shown measured subjects → one letter. */
export function overallLetter(scores: number[]): Letter | null {
  if (!scores.length) return null
  return letterFromScore(scores.reduce((a, b) => a + b, 0) / scores.length)
}

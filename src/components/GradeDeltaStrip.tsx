import { GradeLetter } from '@/components/GradeLetter'
import { letterFromScore, type Letter } from '@/lib/grades'
import type { DimensionScore, StoredSession } from '@/lib/types'

const LETTER_RANK: Record<string, number> = {
  'A+': 12, A: 11, 'A-': 10, 'B+': 9, B: 8, 'B-': 7, 'C+': 6, C: 5, 'C-': 4, D: 3,
}

type Bucket = { id: string; label: string; ids: string[] }

const BUCKETS: Bucket[] = [
  { id: 'tires', label: 'Tire management', ids: ['D19'] }, // D19 tire management — not chassis/PSI setup
  { id: 'drive', label: 'Drive', ids: ['D2', 'D3', 'D4'] },
  { id: 'pace', label: 'Pace', ids: ['D10'] },
  { id: 'cons', label: 'Cons.', ids: ['D18'] },
  { id: 'race', label: 'Race', ids: ['D14', 'D15', 'D16', 'D17'] },
]

export type GradeVocabulary = 'letters' | 'numbers'

function meanScore(scores: DimensionScore[] | undefined, ids: string[]): number | null {
  if (!scores?.length) return null
  const vals = ids
    .map((id) => scores.find((s) => s.dimension_id === id)?.score)
    .filter((n): n is number => n != null && Number.isFinite(n))
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function letterDelta(prev: Letter | null, now: Letter | null): number | null {
  if (!prev || !now) return null
  return (LETTER_RANK[now] ?? 0) - (LETTER_RANK[prev] ?? 0)
}

function fmtScore(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toFixed(1)
}

export function GradeDeltaStrip({
  current,
  previous,
  vocabulary = 'letters',
}: {
  current: StoredSession
  previous: StoredSession | null
  /** Driver view → letters; Coach view → 0–5 numbers. */
  vocabulary?: GradeVocabulary
}) {
  const pills = BUCKETS.map((b) => {
    const nowScore = meanScore(current.report?.scores, b.ids)
    const prevScore = meanScore(previous?.report?.scores, b.ids)
    const now = letterFromScore(nowScore)
    const prev = letterFromScore(prevScore)
    const dLetter = letterDelta(prev, now)
    const dNum =
      prevScore != null && nowScore != null && Number.isFinite(prevScore) && Number.isFinite(nowScore)
        ? nowScore - prevScore
        : null
    return { ...b, now, prev, nowScore, prevScore, dLetter, dNum }
  }).filter((p) =>
    vocabulary === 'numbers'
      ? p.nowScore != null || p.prevScore != null
      : p.now != null || p.prev != null,
  )

  if (!previous) {
    return (
      <section className="rounded-2xl border border-n10-border bg-n10-panel px-4 py-3">
        <h2 className="text-base font-bold text-white">vs last session</h2>
        <p className="mt-2 text-sm text-n10-soft">First session — no prior baseline.</p>
      </section>
    )
  }

  if (!pills.length) {
    return (
      <section className="rounded-2xl border border-n10-border bg-n10-panel px-4 py-3">
        <h2 className="text-base font-bold text-white">vs last session</h2>
        <p className="mt-2 text-sm text-n10-soft">Not enough graded skills yet to compare.</p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-n10-border bg-n10-panel px-4 py-3">
      <div>
        <h2 className="text-base font-bold text-white">vs last session</h2>
        <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-n10-mute">prev → now</p>
      </div>
      <div className="mt-3 flex overflow-x-auto pb-1" style={{ gap: 10 }}>
        {pills.map((p) => {
          const d = vocabulary === 'numbers' ? p.dNum : p.dLetter
          const up = d != null && d > 0
          const down = d != null && d < 0
          const tone = up
            ? 'border-emerald-400/35 bg-emerald-400/10'
            : down
              ? 'border-rose-400/35 bg-rose-400/10'
              : 'border-n10-border bg-n10-card'
          const arrow = up ? '▲' : down ? '▼' : d === 0 ? '●' : null
          const arrowColor = up ? 'text-emerald-400' : down ? 'text-rose-400' : 'text-n10-mute'
          return (
            <div key={p.id} className={`min-w-[6.25rem] flex-1 rounded-xl border ${tone}`} style={{ padding: '12px 10px' }}>
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold text-n10-mute truncate" title={p.id === 'tires' ? 'Tire management — how well pace holds as the tires wear over the heat.' : undefined}>{p.label}</p>
                {arrow && (
                  <span className={`text-[10px] font-extrabold leading-none ${arrowColor}`} aria-hidden>
                    {arrow}
                  </span>
                )}
              </div>
              {vocabulary === 'numbers' ? (
                <div className="mt-2 flex items-end justify-center gap-1.5">
                  <span className="text-lg font-bold text-n10-soft">{fmtScore(p.prevScore)}</span>
                  <span className="pb-0.5 text-sm font-extrabold text-n10-mute">→</span>
                  <span className="text-2xl font-black text-n10-lime">{fmtScore(p.nowScore)}</span>
                </div>
              ) : (
                <div className="mt-2 flex items-end justify-center gap-1.5">
                  {p.prev ? <GradeLetter letter={p.prev} size="lg" className="text-n10-soft" /> : <span className="text-xl text-n10-mute">—</span>}
                  <span className="pb-1 text-sm font-extrabold text-n10-mute">→</span>
                  {p.now ? <GradeLetter letter={p.now} size="xl" className="text-n10-lime" /> : <span className="text-3xl text-n10-mute">—</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

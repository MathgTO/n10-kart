import { GradeLetter } from '@/components/GradeLetter'
import { letterFromScore, type Letter } from '@/lib/grades'
import type { DimensionScore, StoredSession } from '@/lib/types'

const LETTER_RANK: Record<string, number> = {
  'A+': 12, A: 11, 'A-': 10, 'B+': 9, B: 8, 'B-': 7, 'C+': 6, C: 5, 'C-': 4, D: 3,
}

type Bucket = { id: string; label: string; ids: string[] }

/** Glanceable buckets for the between-rounds strip (mockup: Setup / Drive / Pace / Cons. / Race). */
const BUCKETS: Bucket[] = [
  { id: 'setup', label: 'Setup', ids: ['D19'] },
  { id: 'drive', label: 'Drive', ids: ['D2', 'D3', 'D4'] },
  { id: 'pace', label: 'Pace', ids: ['D10'] },
  { id: 'cons', label: 'Cons.', ids: ['D18'] },
  { id: 'race', label: 'Race', ids: ['D14', 'D15', 'D16', 'D17'] },
]

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

function deltaGlyph(d: number): string {
  if (d > 0) return `▲ +${d}`
  if (d < 0) return `▼ ${d}`
  return '● 0'
}

export function GradeDeltaStrip({
  current,
  previous,
}: {
  current: StoredSession
  previous: StoredSession | null
}) {
  const pills = BUCKETS.map((b) => {
    const nowScore = meanScore(current.report?.scores, b.ids)
    const prevScore = meanScore(previous?.report?.scores, b.ids)
    const now = letterFromScore(nowScore)
    const prev = letterFromScore(prevScore)
    const d = letterDelta(prev, now)
    return { ...b, now, prev, d }
  }).filter((p) => p.now != null || p.prev != null)

  if (!previous) {
    return (
      <section className="rounded-2xl border border-n10-border bg-n10-panel px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-bold text-white">vs last session</h2>
        </div>
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
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-bold text-white">vs last session</h2>
        <p className="text-xs font-bold uppercase tracking-wide text-n10-mute">prev → now</p>
      </div>
      <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1" style={{ gap: 10 }}>
        {pills.map((p) => {
          const tone =
            p.d == null ? 'border-n10-border bg-n10-card' : p.d > 0 ? 'border-emerald-400/35 bg-emerald-400/10' : p.d < 0 ? 'border-rose-400/35 bg-rose-400/10' : 'border-n10-border bg-n10-card'
          const deltaColor =
            p.d == null ? 'text-n10-mute' : p.d > 0 ? 'text-emerald-400' : p.d < 0 ? 'text-rose-400' : 'text-n10-soft'
          return (
            <div key={p.id} className={`min-w-[5.5rem] flex-1 rounded-xl border px-2.5 py-1.5 ${tone}`} style={{ padding: '10px 6px' }}>
              <p className="text-[11px] font-bold text-n10-mute truncate">{p.label}</p>
              {p.d != null && <p className={`text-xs font-extrabold ${deltaColor}`}>{deltaGlyph(p.d)}</p>}
              <div className="mt-1 flex items-end justify-center gap-1">
                {p.prev ? <GradeLetter letter={p.prev} size="sm" className="text-n10-soft" /> : <span className="text-sm text-n10-mute">—</span>}
                <span className="pb-0.5 text-xs font-extrabold text-n10-mute">→</span>
                {p.now ? <GradeLetter letter={p.now} size="lg" className="text-n10-lime" /> : <span className="text-lg text-n10-mute">—</span>}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

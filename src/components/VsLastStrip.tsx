import type { ProgressDelta } from '@/lib/types'
import { getDimension, ADVANCE_PRIORITY_AT } from '@/lib/rubric'

export function VsLastStrip({
  deltas,
  priorityAdvanced,
  priorityDim,
  firstOnLayout,
  differentLayoutNote,
}: {
  deltas: ProgressDelta[]
  priorityAdvanced: boolean
  priorityDim: string
  /** Same track/class but layout changed — no apple-to-apple compare. */
  firstOnLayout?: boolean
  differentLayoutNote?: string
}) {
  if (!deltas.length) {
    return (
      <section className="panel">
        <h2 className="text-xl font-bold">vs last session</h2>
        <p className="mt-2 text-base text-n10-soft">
          {firstOnLayout || differentLayoutNote
            ? differentLayoutNote ?? 'First session on this layout — not comparable to other configs.'
            : 'No prior session yet — this becomes your baseline.'}
        </p>
        {differentLayoutNote && (
          <p className="mt-1 text-sm font-semibold text-amber-200/90">Different track config</p>
        )}
      </section>
    )
  }
  const top = deltas.slice(0, 5)
  return (
    <section className="panel max-w-full overflow-x-clip">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">vs last session</h2>
        <p className="text-sm text-n10-soft">
          {priorityAdvanced ? (
            <span className="text-n10-lime font-semibold">Focus moved on: last focus reached {ADVANCE_PRIORITY_AT}/5</span>
          ) : (
            <span>
              Focus stays on {getDimension(priorityDim)?.label ?? 'the same skill'} until it reaches {ADVANCE_PRIORITY_AT}/5
            </span>
          )}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {top.map((d) => {
          const label = getDimension(d.dimension_id)?.label ?? d.dimension_id
          const up = d.delta > 0
          return (
            <div
              key={d.dimension_id}
              className="min-w-0 rounded-xl border border-n10-border bg-n10-card p-3"
            >
              <p className="text-xs font-semibold text-n10-mute truncate">{label}</p>
              <p className={`text-lg font-bold ${up ? 'text-emerald-400' : d.delta < 0 ? 'text-red-400' : 'text-white'}`}>
                {d.delta > 0 ? '+' : ''}
                {d.delta.toFixed(1)}
              </p>
              <p className="text-xs text-n10-mute">
                {d.previous.toFixed(1)} → {d.current.toFixed(1)}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

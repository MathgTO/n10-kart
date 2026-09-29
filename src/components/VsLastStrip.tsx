import type { ProgressDelta } from '@/lib/types'
import { getDimension, ADVANCE_PRIORITY_AT } from '@/lib/rubric'

export function VsLastStrip({
  deltas,
  priorityAdvanced,
  priorityDim,
}: {
  deltas: ProgressDelta[]
  priorityAdvanced: boolean
  priorityDim: string
}) {
  if (!deltas.length) {
    return (
      <section className="panel">
        <h2 className="text-xl font-bold">vs last session</h2>
        <p className="mt-2 text-base text-n10-soft">No prior session yet — this becomes your baseline.</p>
      </section>
    )
  }
  const top = deltas.slice(0, 5)
  return (
    <section className="panel">
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
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {top.map((d) => {
          const label = getDimension(d.dimension_id)?.label ?? d.dimension_id
          const up = d.delta > 0
          return (
            <div
              key={d.dimension_id}
              className="min-w-[7.5rem] rounded-xl border border-n10-border bg-n10-card p-3"
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

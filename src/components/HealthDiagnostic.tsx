import type { StoredSession } from '@/lib/types'
import {
  buildHealthDiagnosticFromSession,
  type HealthCard,
  type HealthStatus,
} from '@/lib/healthDiagnostic'

const STATUS_STYLES: Record<
  HealthStatus,
  { pill: string; border: string; label: string }
> = {
  healthy: {
    pill: 'bg-n10-lime/20 text-n10-lime',
    border: 'border-n10-lime/25',
    label: 'healthy',
  },
  watch: {
    pill: 'bg-amber-500/20 text-amber-200',
    border: 'border-amber-500/25',
    label: 'watch',
  },
  fix: {
    pill: 'bg-rose-500/20 text-rose-300',
    border: 'border-rose-500/30',
    label: 'fix',
  },
}

export function HealthDiagnostic({ session }: { session: StoredSession }) {
  const { cards } = buildHealthDiagnosticFromSession(session)

  return (
    <section className="panel border-teal-500/30">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-teal-500/20 px-2 py-0.5 text-xs font-bold uppercase text-teal-200">
          health
        </span>
        <h2 className="text-xl font-bold">Health diagnostic</h2>
      </div>
      <p className="mt-1 text-sm text-n10-soft">
        Tire pressure · Gear · Clutch — diagnosis + next move from this session. Setup-tagged,
        never mixed into driver blame.
      </p>

      <div className="mt-4 space-y-3">
        {cards.map((card) => (
          <Card key={card.id} card={card} />
        ))}
      </div>
    </section>
  )
}

function Card({ card }: { card: HealthCard }) {
  const style = STATUS_STYLES[card.status]
  return (
    <article className={`rounded-xl border ${style.border} bg-n10-card p-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-white">{card.title}</h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${style.pill}`}
        >
          {style.label}
        </span>
      </div>

      <div className="mt-3">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-200/80">Diagnosis</p>
        <p className="mt-1 text-base text-n10-soft leading-relaxed">{card.diagnosis}</p>
      </div>

      <div className="mt-3">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-200/80">Optimize</p>
        <p className="mt-1 text-base font-bold text-white leading-relaxed">{card.optimize}</p>
      </div>

      {card.metrics && card.metrics.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {card.metrics.map((m) => (
            <span
              key={m.label}
              className="inline-flex items-center gap-1.5 rounded-lg border border-n10-border bg-n10-panel px-2.5 py-1 text-xs"
            >
              <span className="text-n10-mute font-semibold uppercase">{m.label}</span>
              <span className="font-bold text-white">{m.value}</span>
            </span>
          ))}
        </div>
      )}
    </article>
  )
}

import { Link } from 'react-router-dom'
import type { StoredSession } from '@/lib/types'
import {
  buildHealthDiagnosticFromSession,
  CLUTCH_SHOP_CHECKLIST,
  type HealthCard,
  type HealthStatus,
  type OneChangeRecommendation,
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
  const { cards, oneChange } = buildHealthDiagnosticFromSession(session)

  return (
    <section className="panel border-teal-500/30">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-teal-500/20 px-2 py-0.5 text-xs font-bold uppercase text-teal-200">
          health
        </span>
        <h2 className="text-xl font-bold">Health evidence</h2>
      </div>
      <p className="mt-1 text-sm text-n10-soft">
        For tuners: tire pressure · gear · clutch — diagnosis + next move from this session.
        Setup-tagged, never mixed into driver blame. N10 rule:{' '}
        <span className="font-semibold text-teal-100">one setup category per outing</span>{' '}
        (gear OR clutch OR tires — magnitude from data; no stacking categories).
      </p>

      <SetupReadout session={session} />

      <OneChangePanel oneChange={oneChange} />

      <div className="mt-4 space-y-3">
        {cards.map((card) => (
          <Card key={card.id} card={card} />
        ))}
      </div>
    </section>
  )
}

/** Read-only setup summary — setup is edited only in the setup step. */
function SetupReadout({ session }: { session: StoredSession }) {
  const st = session.setup ?? { rearTeeth: session.gearing?.rearTeeth, frontTeeth: session.gearing?.frontTeeth }
  const psi = st.coldPsi
  const psiTxt = psi && (psi.fl ?? psi.rl) != null ? `cold ${[psi.fl, psi.fr, psi.rl, psi.rr].map((p) => (p == null ? '?' : p)).join('/')} psi` : 'cold psi —'
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-n10-border bg-n10-panel/70 px-4 py-3">
      <p className="text-sm text-n10-soft">
        <span className="font-bold text-white">Setup this session:</span> rear {st.rearTeeth ?? '?'}T · front{' '}
        {st.frontTeeth ?? '?'} · {st.tireCompound ?? 'tire —'} · {psiTxt}
      </p>
      <Link to={`/session/${session.id}/setup`} className="btn-secondary min-h-[48px]">
        Edit setup
      </Link>
    </div>
  )
}

function OneChangePanel({ oneChange }: { oneChange: OneChangeRecommendation | null }) {
  if (!oneChange) {
    return (
      <div className="mt-4 rounded-xl border border-n10-border bg-n10-panel/80 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-200/80">
          This outing · one setup category
        </p>
        <p className="mt-1 text-sm text-n10-soft">
          No setup category change this outing — re-check after next log.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-xl border border-teal-400/40 bg-teal-500/10 px-4 py-3 shadow-[0_0_0_1px_rgba(45,212,191,0.12)]">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-100">
          This outing · one setup category
        </p>
        <span className="rounded bg-teal-500/25 px-2 py-0.5 text-xs font-bold uppercase text-teal-100">
          {oneChange.tag}
        </span>
        <span className="rounded bg-n10-panel px-2 py-0.5 text-xs font-bold uppercase text-n10-soft">
          {oneChange.confidence} confidence
        </span>
        <span className="rounded bg-n10-panel px-2 py-0.5 text-xs font-semibold text-n10-mute">
          via {oneChange.source_card.replace('_', ' ')}
        </span>
      </div>
      <p className="mt-2 text-base font-bold text-white leading-relaxed">
        {oneChange.one_change_action}
      </p>
      <p className="mt-2 text-sm text-n10-soft leading-relaxed">
        <span className="font-semibold text-teal-100/90">Hypothesis:</span> {oneChange.hypothesis}
      </p>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <span className="rounded-lg border border-n10-border bg-n10-panel px-2.5 py-1">
          <span className="text-n10-mute font-semibold uppercase">Evidence</span>{' '}
          <span className="font-bold text-white">
            {oneChange.evidence_channels.map((c) => (c === 'rpm' ? 'RPM' : c)).join(', ')}
          </span>
        </span>
      </div>
    </div>
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

      {card.headline && (
        <p className="mt-2 text-lg font-black text-white" data-testid={`${card.id}-headline`}>
          {card.headline}
        </p>
      )}

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

      {card.id === 'clutch' && <ClutchShopChecklist />}
    </article>
  )
}

/** Compact always-visible Hilliard Inferno Flame shop checklist under the clutch card. */
function ClutchShopChecklist() {
  return (
    <div className="mt-3 rounded-lg border border-n10-border/60 bg-n10-panel/60 px-3 py-2">
      <p className="text-xs font-bold uppercase tracking-wide text-teal-200/70">
        Shop checklist · Hilliard Inferno Flame · setup only
      </p>
      <ol className="mt-1.5 list-decimal space-y-0.5 pl-4 text-xs leading-snug text-n10-mute">
        {CLUTCH_SHOP_CHECKLIST.map((line) => (
          <li key={line.slice(0, 32)}>{line}</li>
        ))}
      </ol>
    </div>
  )
}

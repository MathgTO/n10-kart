import type { GearAdvice } from '@/lib/gearRatio'

export function GearRatioBand({ advice }: { advice: GearAdvice | null }) {
  if (!advice) {
    return (
      <section className="panel border-amber-500/30">
        <h2 className="text-xl font-bold">Ideal gear ratio</h2>
        <p className="mt-2 text-base text-n10-soft">
          Need peak speed + peak RPM on a lap to estimate. Import MyChron/CSV with those channels.
        </p>
      </section>
    )
  }

  const absTeeth = Math.max(1, Math.abs(advice.toothDelta) || 1)
  const actionLabel =
    advice.action === 'plus'
      ? `Shorter (+${absTeeth} rear tooth)`
      : advice.action === 'minus'
        ? `Longer (−${absTeeth} rear tooth)`
        : 'Hold'

  return (
    <section className="panel border-amber-500/30">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-bold uppercase text-amber-200">
          setup · gear
        </span>
        <h2 className="text-xl font-bold">Ideal gear ratio band</h2>
      </div>
      <p className="mt-1 text-sm text-n10-soft">
        From peak {advice.peakSpeedKmh.toFixed(0)} km/h @ {Math.round(advice.peakRpm)} RPM → keep
        engine in 5,800–6,100.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Est. current ratio" value={advice.estimatedCurrentRatio.toFixed(2)} />
        <Stat
          label="Ideal band"
          value={`${advice.idealBand.lo.toFixed(2)}–${advice.idealBand.hi.toFixed(2)}`}
        />
        <Stat
          label="Suggested rear (17T)"
          value={`${advice.suggestedRearTeeth.lo}–${advice.suggestedRearTeeth.hi}T`}
        />
      </div>

      <p className="mt-4 text-lg font-bold text-n10-lime">{actionLabel}</p>
      <p className="mt-2 text-base text-n10-soft leading-relaxed">{advice.summary}</p>
      <p className="mt-2 text-sm text-n10-mute leading-relaxed">{advice.detail}</p>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-n10-border bg-n10-card p-3">
      <p className="text-xs font-bold uppercase text-n10-mute">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  )
}

import { EXIT_RPM_BAND } from '@/lib/rubric'
import { formatRpm } from '@/lib/format'

export function ExitRpmBand({ rpm }: { rpm?: number }) {
  const lo = EXIT_RPM_BAND.lo
  const hi = EXIT_RPM_BAND.hi
  const v = rpm ?? 0
  const pct = Math.min(100, Math.max(0, ((v - 4000) / (6500 - 4000)) * 100))
  const inBand = v >= lo && v <= hi
  return (
    <section className="panel">
      <h2 className="text-xl font-bold">Exit RPM band</h2>
      <p className="text-sm text-n10-soft mt-1">
        LO206 Junior · live ~{lo}–{hi}. Yellow .570″ slide → gear for restricted peak, not limiter ego.
      </p>
      <div className="mt-4 relative h-4 rounded-full bg-neutral-800 overflow-hidden">
        <div
          className="absolute top-0 bottom-0 bg-n10-lime/30"
          style={{
            left: `${((lo - 4000) / 2500) * 100}%`,
            width: `${((hi - lo) / 2500) * 100}%`,
          }}
        />
        <div
          className={`absolute top-0 h-4 w-1.5 ${inBand ? 'bg-n10-lime' : 'bg-amber-400'}`}
          style={{ left: `calc(${pct}% - 3px)` }}
        />
      </div>
      <p className="mt-3 text-2xl font-black">
        {formatRpm(rpm)}{' '}
        <span className={`text-base font-semibold ${inBand ? 'text-n10-lime' : 'text-amber-300'}`}>
          {inBand ? 'in band' : v < lo ? 'lazy — setup?' : 'near/over limiter'}
        </span>
      </p>
    </section>
  )
}

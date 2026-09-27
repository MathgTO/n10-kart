import type { CoachingReport } from '@/lib/types'

const TIRE_IDS = new Set(['tire_pressure_session', 'tire_pressure_race_heat'])
const GEAR_IDS = new Set([
  'gear_ratio_optimize',
  'gear_plus_one',
  'gear_minus_one',
  'restricted_slide_gearing',
])

export function SetupBox({ items }: { items: CoachingReport['setup_hypotheses'] }) {
  const tires = items.filter((h) => TIRE_IDS.has(h.id))
  const gear = items.filter((h) => GEAR_IDS.has(h.id))
  const other = items.filter((h) => !TIRE_IDS.has(h.id) && !GEAR_IDS.has(h.id))

  return (
    <section className="panel border-amber-500/30">
      <div className="flex items-center gap-2">
        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-bold uppercase text-amber-200">
          setup
        </span>
        <h2 className="text-xl font-bold">Setup hypotheses</h2>
      </div>
      <p className="mt-1 text-sm text-n10-soft">
        Tire pressure + gear ratio flags — tagged separately, never mixed into driver blame.
      </p>

      {items.length === 0 ? (
        <p className="mt-3 text-base text-n10-soft">No setup flags this session.</p>
      ) : (
        <div className="mt-4 space-y-5">
          <Group title="Tire pressure" items={tires} empty="No tire-pressure flag this session." />
          <Group title="Gear ratio" items={gear} empty="No gear-ratio flag this session." />
          {other.length > 0 && <Group title="Other setup" items={other} />}
        </div>
      )}
    </section>
  )
}

function Group({
  title,
  items,
  empty,
}: {
  title: string
  items: CoachingReport['setup_hypotheses']
  empty?: string
}) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wide text-amber-200">{title}</h3>
      {items.length === 0 ? (
        empty ? <p className="mt-2 text-sm text-n10-mute">{empty}</p> : null
      ) : (
        <ul className="mt-2 space-y-3">
          {items.map((h) => (
            <li key={h.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-xs font-bold uppercase text-amber-200">{labelFor(h.id)}</p>
              <p className="mt-1 text-base text-n10-soft">{h.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function labelFor(id: string): string {
  const map: Record<string, string> = {
    tire_pressure_session: 'Session pressures',
    tire_pressure_race_heat: 'Race / heat pressures',
    gear_ratio_optimize: 'Ratio optimization',
    gear_plus_one: '+1 rear tooth',
    gear_minus_one: '−1 rear tooth',
    restricted_slide_gearing: 'Junior restricted slide',
    clutch_health: 'Clutch',
    chassis_before_engine: 'Chassis first',
  }
  return map[id] ?? id
}

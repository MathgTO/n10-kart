import { useMemo } from 'react'
import { getClassConfig } from '@/lib/classConfig'
import { cornerExitStats } from '@/lib/cornerExit'
import { getLayout } from '@/lib/mosportLayouts'
import type { StoredSession } from '@/lib/types'

/**
 * Corner exits (replaces the old exit-RPM band): RPM 0.8 s / 1.5 s after the minimum speed in each slow corner,
 * always paired with the minimum speed, against the class corner-exit floor. Never against the peak-speed band.
 */
export function CornerExitsDetail({ session, confoundNote }: { session: StoredSession; confoundNote?: string }) {
  const cls = getClassConfig(session.classId)
  const floor = cls.cornerExitLowRpm
  const stats = useMemo(() => cornerExitStats(session.laps, floor), [session.laps, floor])
  const rows = useMemo(() => {
    const layout = session.trackId === 'mosport' ? getLayout(session.layoutId ?? 'gp') : null
    const bins = new Map<number, typeof stats.windows>()
    for (const w of stats.windows) {
      const k = Math.round(w.dist * 25)
      bins.set(k, [...(bins.get(k) ?? []), w])
    }
    const med = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[xs.length >> 1] : undefined)
    return [...bins.entries()]
      .filter(([, ws]) => ws.length >= 3)
      .sort((a, b) => a[0] - b[0])
      .map(([k, ws]) => {
        const distFrac = k / 25
        const name = layout
          ? [...layout.corners].sort((a, b) => Math.abs(a.dist / layout.length - distFrac) - Math.abs(b.dist / layout.length - distFrac))[0]?.name
          : `${Math.round(distFrac * 100)}% lap`
        return {
          name: name ?? `${Math.round(distFrac * 100)}% lap`,
          n: ws.length,
          minSpeed: med(ws.map((w) => w.minSpeed)),
          rpm08: med(ws.map((w) => w.rpm08 ?? NaN).filter(Number.isFinite)),
          rpm15: med(ws.map((w) => w.rpm15 ?? NaN).filter(Number.isFinite)),
        }
      })
  }, [stats, session.trackId, session.layoutId])

  const gps = session.sourceKind === 'xrk' || session.sourceKind === 'xrz'
  return (
    <section className="panel">
      <h2 className="text-xl font-bold">Corner exits</h2>
      <p className="mt-1 text-sm text-n10-soft">
        RPM 0.8 s and 1.5 s after the slowest point of each slow corner, with the minimum speed.{' '}
        {floor != null ? (
          <>
            Class floor <span className="font-bold text-n10-teal">~{floor} RPM at 0.8 s</span> ({cls.label}, working threshold).
          </>
        ) : (
          'Class floor unknown — numbers shown without a grade.'
        )}
      </p>
      {(gps || confoundNote) && (
        <p className="mt-2 rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
          {confoundNote ?? 'GPS speed only — exit read is medium confidence.'}
          {confoundNote && gps ? ' GPS speed only.' : ''}
        </p>
      )}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-n10-mute">
            <tr>
              <th className="py-2 pr-3 font-semibold">Corner</th>
              <th className="py-2 pr-3 font-semibold">Min speed</th>
              <th className="py-2 pr-3 font-semibold">RPM @0.8 s</th>
              <th className="py-2 pr-3 font-semibold">RPM @1.5 s</th>
              <th className="py-2 font-semibold">Laps</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-n10-border">
            {rows.map((r) => {
              const soft = floor != null && r.rpm08 != null && r.rpm08 < floor
              return (
                <tr key={r.name + r.n}>
                  <td className="py-2 pr-3 font-semibold text-white">{r.name}</td>
                  <td className="py-2 pr-3">{r.minSpeed != null ? `${Math.round(r.minSpeed)} km/h` : '—'}</td>
                  <td className={`py-2 pr-3 font-bold ${soft ? 'text-amber-200' : 'text-white'}`}>{r.rpm08 != null ? Math.round(r.rpm08) : '—'}{soft ? ' · under floor' : ''}</td>
                  <td className="py-2 pr-3">{r.rpm15 != null ? Math.round(r.rpm15) : '—'}</td>
                  <td className="py-2">{r.n}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-sm text-n10-mute">
        Session median: {stats.medianRpm08 != null ? `${Math.round(stats.medianRpm08)} RPM @0.8 s` : '—'} ·{' '}
        {stats.medianMinSpeed != null ? `${Math.round(stats.medianMinSpeed)} km/h min` : '—'}
        {stats.softShare != null ? ` · ${Math.round(stats.softShare * 100)}% of exits under the floor` : ''}
      </p>
    </section>
  )
}

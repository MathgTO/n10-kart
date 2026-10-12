import { useMemo, useState } from 'react'
import type { LapData } from '@/lib/types'
import { computeDelta } from '@/lib/telemetry'

interface Props {
  best: LapData
  reference: LapData
  cornerLabels?: { name: string; at: number }[]
  /** Class peak-speed band (straight-line story only), from classConfig. Omitted when the class has none. */
  band?: { lo: number; hi: number }
  /** Corner-exit floor line (class working threshold). */
  floor?: number
}

export function OverlayCharts({ best, reference, cornerLabels, band, floor }: Props) {
  const [scrub, setScrub] = useState(0.35)
  // Positive delta = compare (reference) losing time to best ★
  const delta = useMemo(
    () => computeDelta(reference.samples, best.samples),
    [best, reference]
  )

  return (
    <section className="panel space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">Speed + RPM overlay</h2>
          <p className="text-sm text-n10-soft mt-1">
            Best ★ vs compare lap. Shaded band = class peak-speed band (straights); dashed teal = corner-exit floor.
          </p>
        </div>
        <div className="text-sm text-n10-soft">
          <span className="inline-block w-3 h-3 rounded-sm bg-n10-lime mr-1" /> Best ★{' '}
          <span className="inline-block w-3 h-3 rounded-sm bg-sky-400 ml-3 mr-1" /> Compare
        </div>
      </div>

      <Chart
        title="Speed (km/h)"
        a={best.samples}
        b={reference.samples}
        keyName="speed"
        scrub={scrub}
        yMax={110}
      />
      <Chart
        title="RPM"
        a={best.samples}
        b={reference.samples}
        keyName="rpm"
        scrub={scrub}
        yMin={3000}
        yMax={6400}
        band={band}
        floor={floor}
      />
      <DeltaChart delta={delta} scrub={scrub} cornerLabels={cornerLabels} />

      <label className="block">
        <span className="label-lg">Scrubber · {(scrub * 100).toFixed(0)}% lap</span>
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(scrub * 1000)}
          onChange={(e) => setScrub(Number(e.target.value) / 1000)}
          className="mt-2 w-full accent-n10-lime"
        />
      </label>
    </section>
  )
}

function Chart({
  title,
  a,
  b,
  keyName,
  scrub,
  yMin = 0,
  yMax,
  band,
  floor,
}: {
  title: string
  a: LapData['samples']
  b: LapData['samples']
  keyName: 'speed' | 'rpm'
  scrub: number
  yMin?: number
  yMax: number
  band?: { lo: number; hi: number }
  floor?: number
}) {
  const W = 640
  const H = 140
  const path = (samples: typeof a, color: string) => {
    const pts = samples
      .map((s) => {
        const x = s.dist * W
        const v = s[keyName]
        const y = H - ((v - yMin) / (yMax - yMin)) * H
        return `${x},${y}`
      })
      .join(' ')
    return <polyline fill="none" stroke={color} strokeWidth="2" points={pts} />
  }
  const sx = scrub * W
  return (
    <div>
      <p className="text-sm font-semibold text-n10-soft mb-1">{title}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-36 bg-black/50 rounded-lg">
        {band && (
          <rect
            x={0}
            y={H - ((band.hi - yMin) / (yMax - yMin)) * H}
            width={W}
            height={((band.hi - band.lo) / (yMax - yMin)) * H}
            fill="#c8f542"
            opacity={0.08}
          />
        )}
        {floor != null && (
          <line x1={0} x2={W} y1={H - ((floor - yMin) / (yMax - yMin)) * H} y2={H - ((floor - yMin) / (yMax - yMin)) * H} stroke="#2dd4bf" strokeDasharray="6 5" strokeOpacity={0.8} />
        )}
        {path(b, '#38bdf8')}
        {path(a, '#c8f542')}
        <line x1={sx} x2={sx} y1={0} y2={H} stroke="#fff" strokeOpacity={0.4} />
      </svg>
    </div>
  )
}

function DeltaChart({
  delta,
  scrub,
  cornerLabels,
}: {
  delta: { dist: number; deltaMs: number }[]
  scrub: number
  cornerLabels?: { name: string; at: number }[]
}) {
  const W = 640
  const H = 120
  const maxAbs = Math.max(80, ...delta.map((d) => Math.abs(d.deltaMs)))
  const mid = H / 2
  const pts = delta
    .map((d) => {
      const x = d.dist * W
      const y = mid - (d.deltaMs / maxAbs) * (H / 2 - 4)
      return `${x},${y}`
    })
    .join(' ')
  return (
    <div>
      <p className="text-sm font-semibold text-n10-soft mb-1">
        Delta vs reference (gain below / loss above)
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-32 bg-black/50 rounded-lg">
        <line x1={0} x2={W} y1={mid} y2={mid} stroke="#444" />
        <polyline fill="none" stroke="#f87171" strokeWidth="2" points={pts} />
        <line
          x1={scrub * W}
          x2={scrub * W}
          y1={0}
          y2={H}
          stroke="#fff"
          strokeOpacity={0.4}
        />
        {(cornerLabels ?? []).map((c) => (
          <text
            key={c.name}
            x={c.at * W}
            y={14}
            fill="#a3a3a3"
            fontSize="10"
            textAnchor="middle"
          >
            {(c.name.match(/S\d/)?.[0] ?? c.name.split('·')[0]).trim()}
          </text>
        ))}
      </svg>
    </div>
  )
}

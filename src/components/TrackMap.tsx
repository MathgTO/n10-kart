import { useMemo, useState } from 'react'
import {
  MOSPORT_LAYOUTS,
  getLayout,
  pointAt,
  pathSlice,
  type LayoutCorner,
  type TrackLayout,
} from '@/lib/mosportLayouts'
import {
  MOSPORT_GP_SECTORS,
  SECTOR_VS_TURN_HELP,
  sectorForTurn,
  type SectorDef,
} from '@/data/mosportSectors'

const SECTOR_STROKE = ['#38bdf8', '#c8f542', '#fbbf24', '#f472b6']

function matchFocusCorner(layout: TrackLayout, focusName?: string): string | null {
  if (!focusName) return null
  const lower = focusName.toLowerCase()
  const hit = layout.corners.find(
    (c) =>
      lower.includes(c.id) ||
      lower.includes(c.name.toLowerCase()) ||
      (c.name.match(/T\d+/)?.[0] && lower.includes(c.name.match(/T\d+/)![0].toLowerCase())),
  )
  return hit?.id ?? null
}

function bounds(layout: TrackLayout, pad = 28) {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const p of layout.path) {
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y)
    maxY = Math.max(maxY, p.y)
  }
  return {
    minX: minX - pad,
    minY: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
  }
}

function pathD(layout: TrackLayout): string {
  if (!layout.path.length) return ''
  return layout.path.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
}

function turnCode(c: LayoutCorner): string {
  return c.name.match(/T\d+/)?.[0] ?? c.id.toUpperCase()
}

export function TrackMap({
  focusCornerName,
  selectedSectorIndex,
  onSelectSector,
}: {
  focusCornerName?: string
  selectedSectorIndex: number | null
  onSelectSector: (index: number) => void
}) {
  const [layoutId, setLayoutId] = useState('gp')
  const layout = useMemo(() => getLayout(layoutId), [layoutId])
  const focusId = useMemo(() => matchFocusCorner(layout, focusCornerName), [layout, focusCornerName])
  const box = useMemo(() => bounds(layout), [layout])
  const sf = pointAt(layout, 0)

  const activeSector: SectorDef | null =
    selectedSectorIndex != null ? MOSPORT_GP_SECTORS[selectedSectorIndex] ?? null : null

  const selectTurn = (c: LayoutCorner) => {
    const code = turnCode(c)
    const sector = sectorForTurn(code)
    if (sector) onSelectSector(sector.index)
  }

  const selectSector = (s: SectorDef) => {
    onSelectSector(s.index)
  }

  return (
    <section className="panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Track map</h2>
          <p className="mt-1 text-sm text-n10-soft">
            Tap a <span className="text-white font-semibold">sector (S1–S4)</span> or a turn — same
            language as Sector loss below
          </p>
          <p className="mt-1 text-xs text-n10-mute max-w-xl">{SECTOR_VS_TURN_HELP}</p>
        </div>
        <label className="text-sm text-n10-soft">
          Layout
          <select
            className="ml-2 rounded-lg border border-n10-border bg-n10-card px-3 py-2 text-white font-semibold"
            value={layoutId}
            onChange={(e) => setLayoutId(e.target.value)}
          >
            {MOSPORT_LAYOUTS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-2 text-xs text-n10-mute">{layout.blurb}</p>

      <div className="mt-4 overflow-hidden rounded-xl border border-n10-border bg-black/50">
        <svg
          viewBox={`${box.minX} ${box.minY} ${box.width} ${box.height}`}
          className="mx-auto block h-auto w-full max-h-[420px]"
          role="img"
          aria-label={`${layout.name} with sectors and turns`}
        >
          {/* Base track */}
          <path
            d={pathD(layout)}
            fill="none"
            stroke="#2a2a2a"
            strokeWidth={16}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Sector highlights */}
          {MOSPORT_GP_SECTORS.map((s) => {
            const d0 = s.startFrac * layout.length
            const d1 = s.endFrac * layout.length
            const d = pathSlice(layout, d0, d1)
            const on = selectedSectorIndex === s.index
            return (
              <path
                key={s.code}
                d={d}
                fill="none"
                stroke={SECTOR_STROKE[s.index] ?? '#c8f542'}
                strokeWidth={on ? 10 : 5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={on ? 1 : selectedSectorIndex == null ? 0.55 : 0.22}
                className="cursor-pointer"
                onClick={() => selectSector(s)}
              />
            )
          })}
          {/* S/F */}
          <g>
            <circle cx={sf.x} cy={sf.y} r={7} fill="#fff" />
            <text
              x={sf.x + 12}
              y={sf.y + 4}
              fill="#fff"
              fontSize={14}
              fontWeight={700}
              style={{ userSelect: 'none' }}
            >
              S/F
            </text>
          </g>
          {/* Sector mid labels */}
          {MOSPORT_GP_SECTORS.map((s) => {
            const p = pointAt(layout, s.midFrac * layout.length)
            const on = selectedSectorIndex === s.index
            return (
              <g
                key={`lab-${s.code}`}
                role="button"
                tabIndex={0}
                className="cursor-pointer"
                onClick={() => selectSector(s)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    selectSector(s)
                  }
                }}
              >
                <rect
                  x={p.x - 16}
                  y={p.y - 28}
                  width={32}
                  height={18}
                  rx={4}
                  fill={on ? SECTOR_STROKE[s.index] : '#0a0a0a'}
                  stroke={SECTOR_STROKE[s.index]}
                  strokeWidth={1.5}
                  opacity={0.95}
                />
                <text
                  x={p.x}
                  y={p.y - 15}
                  textAnchor="middle"
                  fill={on ? '#000' : SECTOR_STROKE[s.index]}
                  fontSize={11}
                  fontWeight={800}
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {s.code}
                </text>
              </g>
            )
          })}
          {/* Turn pins */}
          {layout.corners.map((c) => {
            const p = pointAt(layout, c.dist)
            const code = turnCode(c)
            const sector = sectorForTurn(code)
            const inActive = sector != null && sector.index === selectedSectorIndex
            const isFocus = c.id === focusId
            const on = inActive || isFocus
            return (
              <g
                key={c.id}
                role="button"
                tabIndex={0}
                className="cursor-pointer"
                onClick={() => selectTurn(c)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    selectTurn(c)
                  }
                }}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={on ? 10 : 7}
                  fill={on ? '#c8f542' : '#0a0a0a'}
                  stroke={on ? '#fff' : '#c8f542'}
                  strokeWidth={on ? 2.4 : 1.6}
                />
                <text
                  x={p.x}
                  y={p.y + 18}
                  textAnchor="middle"
                  fill={on ? '#c8f542' : '#e5e5e5'}
                  fontSize={on ? 12 : 10}
                  fontWeight={700}
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {code}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {MOSPORT_GP_SECTORS.map((s) => {
          const on = selectedSectorIndex === s.index
          return (
            <button
              key={s.code}
              type="button"
              onClick={() => selectSector(s)}
              className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                on
                  ? 'border-n10-lime bg-n10-lime/15 ring-1 ring-n10-lime'
                  : 'border-n10-border bg-n10-card hover:border-n10-lime/50'
              }`}
            >
              <p className="font-bold" style={{ color: SECTOR_STROKE[s.index] }}>
                {s.code}{' '}
                <span className="font-semibold text-n10-soft">
                  = {s.turns[0]}–{s.turns[s.turns.length - 1]}
                </span>
              </p>
              <p className="mt-0.5 text-n10-mute">Timing split · work {s.primaryTurnName}</p>
            </button>
          )
        })}
      </div>

      {activeSector && (
        <div className="mt-3 rounded-xl border border-n10-lime/40 bg-n10-lime/5 px-4 py-3">
          <p className="text-xs font-bold uppercase text-n10-lime">Selected sector</p>
          <p className="mt-1 text-lg font-bold text-white">
            {activeSector.code} · {activeSector.turns.join(', ')}
          </p>
          <p className="text-sm text-n10-soft">
            Timing split — coach turn inside it:{' '}
            <span className="font-semibold text-n10-lime">{activeSector.primaryTurnName}</span>
          </p>
        </div>
      )}
    </section>
  )
}

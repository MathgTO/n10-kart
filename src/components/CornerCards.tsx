import { useEffect, useRef } from 'react'
import type { CornerCue } from '@/lib/types'
import { formatDeltaMs } from '@/lib/format'
import { dimLabel } from '@/lib/rubric'
import { SECTOR_VS_TURN_HELP } from '@/data/mosportSectors'

export function CornerCards({
  corners,
  selectedSectorIndex,
  onSelectSector,
}: {
  corners: CornerCue[]
  selectedSectorIndex: number | null
  onSelectSector: (index: number) => void
}) {
  const refs = useRef<Record<number, HTMLElement | null>>({})

  // Only follow the user's taps — never jump the page on first render (the report opens at the top).
  const first = useRef(true)
  useEffect(() => {
    if (selectedSectorIndex == null) return
    if (first.current) {
      first.current = false
      return
    }
    const el = refs.current[selectedSectorIndex]
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedSectorIndex])

  return (
    <section className="panel" id="sector-loss">
      <h2 className="text-xl font-bold">Sector loss</h2>
      <p className="text-sm text-n10-soft mt-1">{SECTOR_VS_TURN_HELP}</p>
      <p className="text-xs text-n10-mute mt-1">
        Same S1–S4 as the track map — tap a card or a sector on the map. Time is compared by
        distance along the lap (compare lap vs best ★).
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {corners.map((c) => {
          const on = selectedSectorIndex === c.sectorIndex
          return (
            <article
              key={c.id}
              id={`sector-card-${c.sectorCode ?? c.sectorIndex}`}
              ref={(el) => {
                refs.current[c.sectorIndex] = el
              }}
              role="button"
              tabIndex={0}
              onClick={() => onSelectSector(c.sectorIndex)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectSector(c.sectorIndex)
                }
              }}
              className={`rounded-xl border p-4 text-left transition cursor-pointer ${
                on
                  ? 'border-n10-lime bg-n10-lime/15 ring-2 ring-n10-lime/60'
                  : c.bias
                    ? 'border-n10-lime/40 bg-n10-lime/5 hover:border-n10-lime/70'
                    : 'border-n10-border bg-n10-card hover:border-n10-lime/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-lg">{c.name}</h3>
                <span className="text-sm font-semibold text-n10-lime">
                  {c.lossMs != null ? formatDeltaMs(c.lossMs) : '—'}
                </span>
              </div>
              {c.primaryTurnName && (
                <p className="mt-1 text-sm text-white">
                  Work the turn:{' '}
                  <span className="font-semibold text-n10-lime">{c.primaryTurnName}</span>
                </p>
              )}
              {c.turns && c.turns.length > 0 && (
                <p className="mt-0.5 text-xs text-n10-mute">Turns in this split: {c.turns.join(', ')}</p>
              )}
              <p className="mt-1 text-xs font-semibold uppercase text-n10-mute">{dimLabel(c.dimId)}</p>
              <p className="mt-2 text-sm">
                <span className="text-emerald-400 font-semibold">Good:</span>{' '}
                <span className="text-n10-soft">{c.good}</span>
              </p>
              <p className="mt-1 text-sm">
                <span className="text-red-400 font-semibold">Bad:</span>{' '}
                <span className="text-n10-soft">{c.bad}</span>
              </p>
              <p className="mt-2 text-base font-medium text-white">Cue: {c.cue}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

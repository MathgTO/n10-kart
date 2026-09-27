/**
 * Language lock:
 * - Turns (T1–T12) = corners on the map — technique / coach call.
 * - Sectors (S1–S4) = MyChron-style timing splits that GROUP turns — where time was lost.
 */
export type SectorDef = {
  index: number
  code: string // S1
  /** Short chart label */
  chartLabel: string
  /** Turns inside this sector (GP full) */
  turns: string[]
  /** Primary turn for the coach call when this sector loses most */
  primaryTurn: string
  primaryTurnName: string
  /** Mid-sector fraction for chart markers */
  midFrac: number
  /** Inclusive start / exclusive end along the lap (0–1) */
  startFrac: number
  endFrac: number
}

/** Default Mosport GP full sector → turn map (matches layout fracs ~0 / 0.245 / 0.426 / 0.679 / 1). */
export const MOSPORT_GP_SECTORS: SectorDef[] = [
  {
    index: 0,
    code: 'S1',
    chartLabel: 'S1',
    turns: ['T1', 'T2', 'T3'],
    primaryTurn: 'T2',
    primaryTurnName: 'T2 Crest',
    midFrac: 0.125,
    startFrac: 0,
    endFrac: 0.245,
  },
  {
    index: 1,
    code: 'S2',
    chartLabel: 'S2',
    turns: ['T4', 'T5'],
    primaryTurn: 'T4',
    primaryTurnName: 'T4 Hairpin',
    midFrac: 0.375,
    startFrac: 0.245,
    endFrac: 0.426,
  },
  {
    index: 2,
    code: 'S3',
    chartLabel: 'S3',
    turns: ['T6', 'T7', 'T8', 'T9'],
    primaryTurn: 'T9',
    primaryTurnName: 'T9 Sweep',
    midFrac: 0.625,
    startFrac: 0.426,
    endFrac: 0.679,
  },
  {
    index: 3,
    code: 'S4',
    chartLabel: 'S4',
    turns: ['T10', 'T11', 'T12'],
    primaryTurn: 'T12',
    primaryTurnName: 'T12 Last',
    midFrac: 0.875,
    startFrac: 0.679,
    endFrac: 1,
  },
]

export function sectorTitle(s: SectorDef): string {
  return `${s.code} · ${s.turns[0]}–${s.turns[s.turns.length - 1]}`
}

export function sectorBlurb(s: SectorDef): string {
  return `Timing split covering ${s.turns.join(', ')}`
}

/** Labels used for chart ticks + track.corners (sectorFrac = mid of sector). */
export function sectorTrackCorners() {
  return MOSPORT_GP_SECTORS.map((s) => ({
    name: sectorTitle(s),
    sectorFrac: s.midFrac,
    code: s.code,
    turns: s.turns,
    primaryTurnName: s.primaryTurnName,
  }))
}

export const SECTOR_VS_TURN_HELP =
  'Turns (T1–T12) are corners on the map. Sectors (S1–S4) are timing splits that group those turns — where the lap lost time vs best.'

export function sectorForTurn(turnCode: string): SectorDef | undefined {
  const u = turnCode.toUpperCase()
  return MOSPORT_GP_SECTORS.find((s) => s.turns.some((t) => t === u || u.startsWith(t)))
}

export function sectorByIndex(i: number): SectorDef | undefined {
  return MOSPORT_GP_SECTORS[i]
}

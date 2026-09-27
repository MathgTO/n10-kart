export type SeriesTag = 'practice' | 'mika' | 'bsc_ontario' | 'other' | 'qualifying' | 'race'
export type Conditions = 'dry' | 'wet'
export type DimensionId = `D${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20}` | string
export type DrillId = string
export type SetupHypothesisId = string

export type EvidenceKind = 'mychron' | 'kart_cam' | 'needs_kart_cam' | 'heuristic'

export interface TelemetrySample {
  t: number // seconds from lap start
  dist: number // 0..1 normalized or meters
  speed: number // km/h
  rpm: number
}

export interface LapData {
  index: number
  timeMs: number
  samples: TelemetrySample[]
  sectorLossMs?: number[]
  minSpeed?: number
  maxSpeed?: number
  maxRpm?: number
  exitRpmFocus?: number
}

export interface CornerCue {
  id: string
  name: string
  /** S1–S4 code */
  sectorCode?: string
  /** Turns inside this sector, e.g. T4, T5 */
  turns?: string[]
  /** Primary turn for technique work in this sector */
  primaryTurnName?: string
  sectorIndex: number
  dimId: DimensionId
  good: string
  bad: string
  cue: string
  bias?: boolean
  lossMs?: number
}

export interface DimensionScore {
  dimension_id: DimensionId
  score: number
  evidence_kind: EvidenceKind
  evidence_markers: string[]
  notes?: string
}

export interface WeaknessFinding {
  dimension_id: DimensionId
  score: number
  marker: string
  cue: string
}

export interface ProgressDelta {
  dimension_id: DimensionId
  previous: number
  current: number
  delta: number
}

export interface CoachingReport {
  session_id: string
  track: string
  class_assumption: string
  scores: DimensionScore[]
  composites: {
    qualifying_pace_index: number
    racecraft_index: number
    race_win_index: number
  }
  top_weaknesses: WeaknessFinding[]
  strengths: WeaknessFinding[]
  primary_drill: { id: DrillId; name: string; message: string }
  priority_dimension_id: DimensionId
  priority_advanced: boolean
  setup_hypotheses: { id: SetupHypothesisId; tag: 'setup'; message: string }[]
  racecraft_cue: string | null
  vs_last: ProgressDelta[]
  focus: NextRunFocus
  source_linkouts: { title: string; url: string }[]
}

export interface NextRunFocus {
  sectorIndex: number
  /** Primary turn for the coach call (T4 Hairpin) — technique language */
  cornerName: string
  /** Timing bucket that lost most, e.g. S2 · T4–T5 */
  sectorLabel?: string
  lossMs: number
  brake: string
  apex: string
  exit: string
  drillName: string
  drillInstruction: string
  exitRpm?: number
  referenceLapIndex: number
  bestLapIndex: number
}

export interface StoredSession {
  id: string
  createdAt: string
  title: string
  series: SeriesTag
  conditions: Conditions
  trackId: string
  trackName: string
  classAssumption: string
  notes?: string
  isDemo?: boolean
  sourceFileName?: string
  sourceKind?: 'csv' | 'xrz' | 'xrk' | 'demo'
  laps: LapData[]
  referenceLapIndex: number
  bestLapIndex: number
  corners: CornerCue[]
  report: CoachingReport
  activePriorityDimensionId: DimensionId
  activePriorityDrillId: DrillId
  videoObjectUrl?: string
  videoName?: string
  videoCueMarkers?: { t: number; label: string }[]
}

export interface TrackInfo {
  id: string
  name: string
  region: string
  location: string
  ontario?: boolean
  home?: boolean
  corners: { name: string; sectorFrac: number }[]
}


export interface ParseResult {
  ok: boolean
  kind: 'csv' | 'xrz' | 'xrk' | 'unknown'
  laps: LapData[]
  channels: { speed: boolean; rpm: boolean; lapTimes: boolean }
  message: string
  needsCsvFallback?: boolean
  fileName: string
}

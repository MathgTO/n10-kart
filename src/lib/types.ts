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
  /** MyChron / CSV lap number when known (prefer over index+1 in UI). */
  lapNumber?: number
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
  /** null when the dim cannot be measured (missing MyChron channels or kart-cam) */
  score: number | null
  evidence_kind: EvidenceKind
  evidence_markers: string[]
  notes?: string
  /** Short UI reason when score is null, e.g. "needs cam" / "needs channels" */
  unavailable_reason?: 'needs_cam' | 'needs_channels'
  /** Kart (setup) or data quality explains this symptom → context only, no letter, no driver priority. */
  setup_confounded?: boolean
  /** medium = GPS-only speed / partial windows. */
  confidence?: 'high' | 'medium' | 'low'
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
    qualifying_pace_index: number | null
    racecraft_index: number | null
    race_win_index: number | null
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
  /** RPM 0.8 s after the slowest point of the focus turn (compare lap). */
  exitRpm?: number
  /** Minimum speed at that turn (km/h) — RPM is always paired with speed. */
  exitMinSpeed?: number
  referenceLapIndex: number
  bestLapIndex: number
}

export interface StoredSession {
  id: string
  createdAt: string
  /** When the session actually ran (local, 'YYYY-MM-DDTHH:mm:ss'); bundled samples carry a clock-corrected date. */
  recordedAt?: string
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
  /** Sprockets run this session (teeth). Rear unknown → gear advice shows ratio change only. */
  gearing?: { rearTeeth?: number; frontTeeth?: number }
  /** Class id (junior_light | junior | senior | other). classAssumption keeps the display label. */
  classId?: string
  /** Kart setup entered in the setup step (single source for the setup card + tuner voice). */
  setup?: SessionSetup
  /** True once the setup step was saved (or 'Same as last round'). */
  setupConfirmed?: boolean
  driverId?: string
  /** How the driver was assigned. */
  driverSource?: 'logger' | 'manual' | 'last_at_track' | 'prompt' | 'migrated'
  logger?: LoggerInfo
  /** Layout inside the venue (e.g. 'gp'); persisted, edited via the setup chip. */
  layoutId?: string
  detectConfidence?: 'high' | 'medium' | 'low' | 'none' | 'manual'
  detection?: TrackDetection
  /** Session start instant (first lap start), ISO UTC. */
  startUtc?: string
  /** IANA zone of the track. */
  timeZone?: string
  tzSource?: 'track' | 'tz-lookup' | 'device' | 'manual'
  dateSource?: 'gps' | 'logger' | 'manual'
  /** Days the logger date was off vs GPS (e.g. -1 = logger one day behind). 0 = OK. */
  dayOffset?: number
  /** Hours mismatch (logger zone/DST misconfigured) when |delta| ≈ whole hours. */
  hourMismatch?: number
  /** User undid the automatic GPS date fix. */
  dateFixUndone?: boolean
  weather?: WeatherSnapshot
  /** Per-session opt-in for share (nothing automatic). */
  shareOptIn?: boolean
  videoObjectUrl?: string
  videoName?: string
  videoCueMarkers?: { t: number; label: string }[]
}

export interface TrackLayoutInfo {
  id: string
  name: string
  /** Measured or nominal lap length (m). */
  lengthM: number
  direction: 'ccw' | 'cw'
  /** True when lengthM comes from real GPS laps. */
  measured?: boolean
}

export interface TrackInfo {
  id: string
  name: string
  /** Short name for labels ('Mosport'). */
  short: string
  region: string
  location: string
  ontario?: boolean
  home?: boolean
  corners: { name: string; sectorFrac: number }[]
  lat?: number
  lon?: number
  /** Venue radius for GPS matching (m). */
  radiusM?: number
  /** IANA zone. */
  tz?: string
  aliases?: string[]
  /** Names AiM writes into the TRK block. */
  aimNames?: string[]
  /** Known S/F points (AiM TRK). */
  sf?: { lat: number; lon: number }[]
  layouts?: TrackLayoutInfo[]
  /** Coordinates confidence. */
  coordConfidence?: 'high' | 'medium'
  /** User-created from a GPS centroid. */
  custom?: boolean
}

export interface LoggerInfo {
  serial?: number
  model?: string
  /** Raw logger header values (TMD/TMT). */
  rawDate?: string
  rawTime?: string
  hwReg?: string
}

export interface GpsSummary {
  goodFixes: number
  centroid?: { lat: number; lon: number }
  extentM?: number
  lapLengthM?: number
  direction?: 'ccw' | 'cw'
}

export interface FileMeta {
  trkName?: string
  sf?: { lat: number; lon: number }
  loggerDate?: string
  loggerTime?: string
  loggerSerial?: number
  loggerModel?: string
  hwReg?: string
  /** UTC ms of the first lap start, from GPS week/iTOW. */
  gpsStartUtcMs?: number
  gps?: GpsSummary
  /** 'speed' source: gps (no wheel speed) or wheel. */
  speedSource?: 'gps' | 'wheel' | 'unknown'
}

export interface TrackDetection {
  trackId: string | null
  layoutId: string | null
  confidence: 'high' | 'medium' | 'low' | 'none'
  score: number
  trkName?: string
  centroid?: { lat: number; lon: number }
  lapLengthM?: number
  direction?: 'ccw' | 'cw'
  /** Nearby candidates (low confidence picker), nearest first. */
  nearby: { trackId: string; distanceM: number }[]
  reason: string
}

export interface WeatherSnapshot {
  airC?: number
  conditions?: string
  precipMm?: number
  wet?: boolean
  source: 'open-meteo' | 'manual'
  fetchedAt?: string
}

export type IntentionalChange = 'gearing' | 'clutch' | 'tires' | 'chassis' | 'none'

export interface SessionSetup {
  rearTeeth?: number
  /** undefined = unknown (never assume 19T). */
  frontTeeth?: number
  clutchEngagementRpm?: number
  /** spring set / shoe / 'unchanged' */
  clutchId?: string
  tireCompound?: string
  coldPsi?: { fl?: number; fr?: number; rl?: number; rr?: number }
  hotPsi?: { fl?: number; fr?: number; rl?: number; rr?: number }
  intentionalChange?: IntentionalChange
  chainOk?: boolean
  rearSpinsFree?: boolean
  weightKg?: number
  notes?: string
}

export interface DriverProfile {
  id: string
  displayName: string
  age?: number
  birthYear?: number
  classDefault?: string
  kidCard: boolean
  shareContact?: { phone?: string; email?: string }
  boundLoggers: { serial: number; model?: string }[]
  /** Reference results per track + class (e.g. a session not in the library), used when no previous session exists. */
  baselines?: DriverBaseline[]
}

export interface DriverBaseline {
  trackId: string
  layoutId?: string
  classId: string
  bestMs: number
  rearTeeth?: number
  airC?: number
  /** Median clutch-locked RPM per km/h (gear-applied check). */
  rpmPerKmh?: number
  dateLabel: string
  dateSpoken: string
  /** When the baseline was set (only sessions after this compare against it). */
  atUtc?: string
  source: string
}


export interface ParseResult {
  ok: boolean
  kind: 'csv' | 'xrz' | 'xrk' | 'unknown'
  laps: LapData[]
  channels: { speed: boolean; rpm: boolean; lapTimes: boolean }
  message: string
  needsCsvFallback?: boolean
  fileName: string
  /** Headers present in the file that N10 did not map to coached channels */
  unmappedColumns?: string[]
  /** Headers recognized (sector/temp/etc.) but not used for coaching charts */
  recognizedUnused?: string[]
  /** File header metadata (track, logger, GPS time) when present. */
  meta?: FileMeta
}

import { buildCoachingReport } from '@/lib/scoring'
import { getClassConfig, DEFAULT_CLASS } from '@/lib/classConfig'
import { synthLap } from '@/lib/telemetry'
import type { LapData, SeriesTag, StoredSession } from '@/lib/types'
import { getTrack } from './tracks'

const DEMO_CLASS = DEFAULT_CLASS // junior_light — Gabriel's real class
const DEMO_CLS = getClassConfig(DEMO_CLASS)

function makeLaps(timesMs: number[], seedBase: number, exitBias = 0): LapData[] {
  return timesMs.map((ms, i) => {
    const lap = synthLap(ms, seedBase + i, {
      exitRpmBias: exitBias - i * 40,
      // Cap at Junior Light limiter so demos never teach yellow-.570 / 6100.
      maxRpm: DEMO_CLS.limiter ?? 6150,
    })
    lap.index = i
    return lap
  })
}

function makeDemo(
  id: string,
  title: string,
  series: SeriesTag,
  createdAt: string,
  times: number[],
  notes: string,
  previous?: StoredSession | null
): StoredSession {
  const track = getTrack('mosport')
  const laps = makeLaps(times, id.length, series === 'practice' ? -200 : 50)
  const bestLapIndex = laps.reduce((bi, l, i) => (l.timeMs < laps[bi].timeMs ? i : bi), 0)
  // Default compare = 2nd-best so delta vs best is visible out of the box
  const ordered = laps
    .map((l, i) => ({ i, t: l.timeMs }))
    .sort((a, b) => a.t - b.t)
  const referenceLapIndex = ordered[1]?.i ?? bestLapIndex
  const { report, corners } = buildCoachingReport({
    sessionId: id,
    track: track.name,
    classAssumption: DEMO_CLS.label,
    classId: DEMO_CLASS,
    series,
    conditions: 'dry',
    laps,
    referenceLapIndex,
    cornerNames: track.corners.map((c) => c.name),
    previousSession: previous ?? null,
  })
  return {
    id,
    createdAt,
    title,
    series,
    conditions: 'dry',
    trackId: track.id,
    trackName: track.name,
    classAssumption: DEMO_CLS.label,
    classId: DEMO_CLASS,
    notes,
    isDemo: true,
    sourceKind: 'demo',
    setup: { tireCompound: DEMO_CLS.defaultTire, rearTeeth: 67 },
    setupConfirmed: true,
    layoutId: 'gp',
    gearing: { rearTeeth: 67 },
    laps,
    referenceLapIndex,
    bestLapIndex,
    corners,
    report,
    activePriorityDimensionId: report.priority_dimension_id,
    activePriorityDrillId: report.primary_drill.id,
  }
}

export function buildDemoSessions(): StoredSession[] {
  const practice = makeDemo(
    'demo-sat-practice',
    'Saturday practice',
    'practice',
    '2026-09-12T14:18:00.000Z',
    [62140, 62480, 63100, 61920, 62200, 61850, 62550, 61780, 62010, 61900, 61820, 62140],
    `Dry practice. Exit RPM soft on hairpin — Junior Light ${DEMO_CLS.slide} gearing check (${DEMO_CLS.limiter} limiter · ${DEMO_CLS.defaultTire}).`
  )
  const quali = makeDemo(
    'demo-sun-qual',
    'Sunday qualifying',
    'qualifying',
    '2026-09-13T13:42:00.000Z',
    [61400, 61680, 61320, 61890, 61250, 61440],
    `Qualifying · Junior Light ${DEMO_CLS.slide} · ${DEMO_CLS.limiter} limiter. Stack the reference — one clean flyer.`,
    practice
  )
  const heat = makeDemo(
    'demo-sun-heat2',
    'Sunday heat 2',
    'bsc_ontario',
    '2026-09-13T17:06:00.000Z',
    [61800, 62100, 61950, 61720, 62240, 61680, 61890, 61750, 61910, 61820],
    `Heat 2 · Junior Light · ${DEMO_CLS.defaultTire}. Racecraft weighted — protect exit after passes.`,
    quali
  )
  return [heat, quali, practice]
}

export const DEMO_IDS = ['demo-sat-practice', 'demo-sun-qual', 'demo-sun-heat2']

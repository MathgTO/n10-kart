/**
 * Health diagnostic (Tire · Gear · Clutch) on the bundled real Mosport samples, built the same way
 * the app's import path does. Run: npx --yes tsx --tsconfig tsconfig.app.json scripts/smoke-health.mts
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseSessionFile } from '../src/lib/csv'
import { buildCoachingReport, pickBestFlyingLap, pickCompareLap } from '../src/lib/scoring'
import { buildHealthDiagnosticFromSession } from '../src/lib/healthDiagnostic'
import { getTrack } from '../src/data/tracks'
import type { StoredSession } from '../src/lib/types'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'public/samples')
const files = [...readdirSync(dir).filter((f) => f.endsWith('.xrk')).map((f) => join(dir, f)), ...process.argv.slice(2)]
for (const f of files) {
  const name = f.split('/').pop()!
  const buf = readFileSync(f)
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
  const parse = await parseSessionFile(new File([ab], name), ab)
  const track = getTrack('mosport')
  const best = pickBestFlyingLap(parse.laps)
  const cmp = pickCompareLap(parse.laps, best)
  const { report, corners } = buildCoachingReport({
    sessionId: 'smoke', track: track.name, classAssumption: 'LO206', series: 'practice', conditions: 'dry',
    laps: parse.laps, referenceLapIndex: cmp, cornerNames: track.corners.map((c) => c.name), channels: parse.channels,
  })
  const session = {
    id: 'smoke', createdAt: '', title: name, series: 'practice', conditions: 'dry', trackId: track.id, trackName: track.name,
    classAssumption: 'LO206', sourceFileName: name, sourceKind: parse.kind, laps: parse.laps, referenceLapIndex: cmp,
    bestLapIndex: best, corners, report, activePriorityDimensionId: report.priority_dimension_id, activePriorityDrillId: report.primary_drill.id,
  } as unknown as StoredSession
  const h = buildHealthDiagnosticFromSession(session)
  console.log(`\n${name}  best L${parse.laps[best].lapNumber} ${parse.laps[best].timeMs} ms · compare L${parse.laps[cmp].lapNumber}`)
  console.log(`  sectors: ${corners.map((c) => `${c.name} ${Math.round(c.lossMs)}`).join(' | ')}`)
  console.log(`  focus: ${report.focus.cornerName} +${Math.round(report.focus.lossMs)} ms`)
  for (const c of h.cards) console.log(`  [${c.id}] ${c.status}: ${c.diagnosis}\n      → ${c.optimize}`)
  console.log(`  oneChange: ${h.oneChange ? `${h.oneChange.source_card}: ${h.oneChange.one_change_action}` : 'none'}`)
  if (h.gearAdvice) console.log(`  gear: ${h.gearAdvice.summary}`)
}

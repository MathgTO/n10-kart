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
import { sampleGearing } from '../src/lib/samples'
import { getClassConfig } from '../src/lib/classConfig'
import type { StoredSession } from '../src/lib/types'

const BEST: Record<string, number> = {
  '2026-09-25_mosport_143726_best-108241.xrk': 68241,
  '2026-09-25_mosport_163712_best-108294.xrk': 68294,
  '2026-10-04_mosport_150240_best-110909.xrk': 70909,
}
let failed = 0
const check = (ok: boolean, msg: string) => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${msg}`)
  if (!ok) failed++
}
/** Every "NNT" tooth count mentioned in a card. */
const teethIn = (txt: string) => [...txt.matchAll(/\b(\d{2})T\b/g)].map((m) => Number(m[1]))

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
  const gearing = sampleGearing(name)
  session.gearing = gearing
  session.classId = 'junior_light'
  session.setup = { rearTeeth: gearing?.rearTeeth }
  const h = buildHealthDiagnosticFromSession(session)
  console.log(`\n${name}  best L${parse.laps[best].lapNumber} ${parse.laps[best].timeMs} ms · compare L${parse.laps[cmp].lapNumber} · gearing ${gearing ? `${gearing.rearTeeth}T rear` : 'unknown'}`)
  console.log(`  sectors: ${corners.map((c) => `${c.name} ${Math.round(c.lossMs)}`).join(' | ')}`)
  console.log(`  focus: ${report.focus.cornerName} +${Math.round(report.focus.lossMs)} ms`)
  for (const c of h.cards) console.log(`  [${c.id}] ${c.status}: ${c.diagnosis}\n      → ${c.optimize}`)
  console.log(`  oneChange: ${h.oneChange ? `${h.oneChange.source_card}: ${h.oneChange.one_change_action}` : 'none'}`)
  if (h.gearAdvice) console.log(`  gear: ${h.gearAdvice.headline} | ${h.gearAdvice.summary}`)

  if (BEST[name]) check(parse.laps[best].timeMs === BEST[name], `best lap ${parse.laps[best].timeMs} ms unchanged`)
  const gc = h.cards.find((c) => c.id === 'gear_ratio')!
  const gearTxt = [gc.headline, gc.diagnosis, gc.optimize, ...(gc.metrics ?? []).map((m) => `${m.label} ${m.value}`)].join(' ')
  if (gearing && h.gearAdvice) {
    const rear = gearing.rearTeeth
    const front = h.gearAdvice.frontTeeth
    const allowed = new Set([rear, front, h.gearAdvice.suggestedRearTeeth, rear + 1, rear - 1].filter((n): n is number => n != null))
    check(gearTxt.includes(`${rear}T`), `gear card shows the entered ${rear}T`)
    check(!/est\.? now|≈\s*\d+T/i.test(gearTxt), 'no "est. now ~NNT" tooth estimate when rear is known')
    check(teethIn(gearTxt).every((t) => allowed.has(t)), `only real/advised tooth counts in card (${[...new Set(teethIn(gearTxt))].join(', ')})`)
    // Gear verdict comes from peak RPM vs the class peak-speed band (KTE), never from corner-exit RPM.
    const band = getClassConfig('junior_light').peakSpeedBand!
    const peak = h.gearAdvice.peakRpm
    if (peak != null && peak >= band.lo && peak <= band.hi) {
      check(h.gearAdvice.action === 'hold' && /Gearing OK/.test(gc.headline ?? ''), `peak ${Math.round(peak)} in class band → "Gearing OK", hold`)
      check(!/too tall/i.test(gearTxt) && h.oneChange?.source_card !== 'gear_ratio', 'peak in band → no "too tall" and no gear one-change')
    }
    // Front unknown → never assumed: no data-check claim, card says so.
    check(h.gearAdvice.dataCheck === undefined, 'front unknown → no ratio data-check (19T never assumed)')
    check(/front \?|Front sprocket unknown/i.test(gearTxt), 'front unknown shown as unknown')
  }
  if (name.startsWith('2026-10-04')) {
    // Kart Tuning Expert Oct 4: 69T confirmed — keep it; next change is tires, not gear.
    check(h.gearAdvice?.rearTeeth === 69, 'Oct 4 uses 69T')
    check(h.gearAdvice?.action === 'hold', `Oct 4 gear verdict is hold (${h.gearAdvice?.headline})`)
    check(h.oneChange?.source_card !== 'gear_ratio', 'Oct 4 one-change is not a gear change')
    const withFront = buildHealthDiagnosticFromSession({ ...session, setup: { rearTeeth: 69, frontTeeth: 19 } })
    check(withFront.gearAdvice?.dataCheck === 'match', `Oct 4 RPM/km/h ${withFront.gearAdvice?.rpmPerKmh?.toFixed(1)} matches 69/19 once the front is entered`)
  }
  if (name.startsWith('2026-09-25')) {
    check(h.gearAdvice?.rearTeeth === 67, 'Sep 25 uses 67T')
    const withFront = buildHealthDiagnosticFromSession({ ...session, setup: { rearTeeth: 67, frontTeeth: 19 } })
    check(withFront.gearAdvice?.dataCheck === 'match', `Sep RPM/km/h ${withFront.gearAdvice?.rpmPerKmh?.toFixed(1)} matches 67/19 once the front is entered`)
  }

  // Rear unknown → ratio change only, never an absolute tooth guess.
  const unknown = buildHealthDiagnosticFromSession({ ...session, gearing: undefined, setup: {} })
  const uc = unknown.cards.find((c) => c.id === 'gear_ratio')!
  const uTxt = [uc.headline, uc.diagnosis, uc.optimize, ...(uc.metrics ?? []).map((m) => `${m.label} ${m.value}`)].join(' ')
  console.log(`  [rear unknown] ${uc.status}: ${uc.headline} → ${uc.optimize}`)
  check(teethIn(uTxt).filter((t) => t >= 40).length === 0, 'rear unknown: no rear tooth estimate shown')
}
console.log(failed ? `\n${failed} health check(s) failed` : '\nAll health smoke checks passed.')
process.exit(failed ? 1 : 0)

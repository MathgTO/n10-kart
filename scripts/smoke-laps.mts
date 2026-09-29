/**
 * Best / compare lap selection on the real Mosport samples (plus any extra .xrk paths given).
 * Run: npx --yes tsx --tsconfig tsconfig.app.json scripts/smoke-laps.mts [extra.xrk ...]
 * Checks: best lap unchanged, compare lap is a different full lap, coach call is not "0 ms",
 * out/in/partial laps are excluded, sector losses add up to the lap-time difference.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseSessionFile } from '../src/lib/csv'
import { buildCoachingReport, pickBestFlyingLap, pickCompareLap } from '../src/lib/scoring'
import { lapValidity } from '../src/lib/telemetry'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const EXPECT: Record<string, number> = {
  '2026-09-25_mosport_143726_best-108241.xrk': 68241,
  '2026-09-25_mosport_163712_best-108294.xrk': 68294,
}
const files = [...Object.keys(EXPECT).map((f) => join(root, 'public/samples', f)), ...process.argv.slice(2)]
let failed = 0
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${msg}`)
  if (!ok) failed++
}
for (const f of files) {
  const name = f.split('/').pop()!
  const buf = readFileSync(f)
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
  const parse = await parseSessionFile(new File([ab], name), ab)
  const laps = parse.laps
  const v = lapValidity(laps)
  const best = pickBestFlyingLap(laps)
  const cmp = pickCompareLap(laps, best)
  const { report, corners } = buildCoachingReport({
    sessionId: 'smoke', track: 'Mosport', classAssumption: 'LO206', series: 'practice', conditions: 'dry',
    laps, referenceLapIndex: cmp, channels: parse.channels,
  })
  const lbl = (i: number) => `L${laps[i].lapNumber ?? i + 1} ${(laps[i].timeMs / 1000).toFixed(3)}`
  console.log(`\n${name}\n  ${laps.map((l, i) => `L${l.lapNumber}=${(l.timeMs / 1000).toFixed(3)}${v[i] === 'ok' ? '' : `(${v[i]})`}`).join(' ')}`)
  if (EXPECT[name]) check(laps[best].timeMs === EXPECT[name], `best ${lbl(best)} (expected ${EXPECT[name]} ms)`)
  check(cmp !== best && v[cmp] === 'ok', `compare ${lbl(cmp)} is a full lap other than best`)
  check(v[best] === 'ok', 'best is a full lap')
  check(Math.round(report.focus.lossMs) !== 0, `coach call ${report.focus.cornerName} +${Math.round(report.focus.lossMs)} ms (not 0 ms)`)
  const sum = corners.reduce((a, c) => a + c.lossMs, 0)
  check(Math.abs(sum - (laps[cmp].timeMs - laps[best].timeMs)) < 5, `sector losses sum ${Math.round(sum)} ms = lap diff ${laps[cmp].timeMs - laps[best].timeMs} ms`)
  check(new Set(corners.map((c) => Math.round(c.lossMs))).size > 1, `sectors differ: ${corners.map((c) => Math.round(c.lossMs)).join(', ')}`)
}
console.log(failed ? `\n${failed} check(s) failed` : '\nAll lap-selection smoke checks passed.')
process.exit(failed ? 1 : 0)

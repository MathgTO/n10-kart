/**
 * Gear advice on the bundled Mosport .xrks using the real app modules (parse → rpm@peak-speed →
 * suggestGearRatio) with each sample's real rear sprocket (Sep 25 = 67T, Oct 4 = 69T).
 * Run: npx --yes tsx --tsconfig tsconfig.app.json scripts/smoke-xrk-gear.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseXrkFile } from '../src/lib/xrk.ts'
import { suggestGearRatio } from '../src/lib/gearRatio.ts'
import { rpmAtPeakSpeed } from '../src/lib/healthDiagnostic.ts'
import { pickBestFlyingLap } from '../src/lib/scoring.ts'
import { sampleGearing } from '../src/lib/samples.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const EXPECT = {
  '2026-09-25_mosport_143726_best-108241.xrk': 68241,
  '2026-09-25_mosport_163712_best-108294.xrk': 68294,
  '2026-10-04_mosport_150240_best-110909.xrk': 70909,
}
let failed = 0
const rpk = {}
for (const [name, bestMs] of Object.entries(EXPECT)) {
  const buf = readFileSync(join(root, 'public/samples', name))
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  const parse = await parseXrkFile(new File([buf], name), ab)
  const best = parse.laps[pickBestFlyingLap(parse.laps)]
  const peak = rpmAtPeakSpeed(parse.laps)
  const g = sampleGearing(name)
  const gear = suggestGearRatio({
    maxRpm: peak.rpmAtPeak ?? best.maxRpm,
    maxSpeedKmh: peak.maxSpeed ?? best.maxSpeed,
    exitRpm: best.exitRpmFocus,
    rearTeeth: g?.rearTeeth,
    rpmPerKmh: peak.rpmPerKmh,
  })
  rpk[name] = peak.rpmPerKmh
  const ok = best.timeMs === bestMs && gear?.rearTeeth === g?.rearTeeth && gear?.dataCheck === 'match'
  if (!ok) failed++
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name} best ${best.timeMs} · ${g?.rearTeeth}T · ${peak.rpmPerKmh?.toFixed(2)} RPM/km/h · ${gear?.headline}`)
}
const sep = (rpk['2026-09-25_mosport_143726_best-108241.xrk'] + rpk['2026-09-25_mosport_163712_best-108294.xrk']) / 2
const oct = rpk['2026-10-04_mosport_150240_best-110909.xrk']
const rise = oct / sep - 1
const riseOk = rise > 0.025 && rise < 0.04
if (!riseOk) failed++
console.log(`${riseOk ? 'OK  ' : 'FAIL'} RPM per km/h Oct 4 vs Sep 25: +${(rise * 100).toFixed(2)}% (69/67 = +2.99%)`)
process.exit(failed ? 1 : 0)

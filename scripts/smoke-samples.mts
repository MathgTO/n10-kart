/**
 * Bundled samples: files exist, owner-confirmed setup seeds, old names dedupe, and the date/time now comes
 * from the file's GPS (no hard-coded recordedAt / title overrides).
 * Run: npx --yes tsx --tsconfig tsconfig.app.json scripts/smoke-samples.mts
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findSample, REAL_SAMPLES, sampleGearing, sampleSetup } from '../src/lib/samples'
import { parseXrkFile } from '../src/lib/xrk'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
let failed = 0
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${msg}`)
  if (!ok) failed++
}
for (const s of REAL_SAMPLES) {
  const p = join(root, 'public/samples', s.file)
  check(existsSync(p), `public/samples/${s.file} exists`)
  check(!('recordedAt' in s) && !('title' in s), `${s.file}: no recordedAt/title override`)
  const buf = readFileSync(p)
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
  const r = await parseXrkFile(new File([ab], s.file), ab)
  const gps = r.meta?.gpsStartUtcMs != null ? new Date(r.meta.gpsStartUtcMs).toISOString() : undefined
  check(gps === s.gpsStartUtc, `${s.file}: GPS start ${gps} = migration constant ${s.gpsStartUtc}`)
}
const oct = REAL_SAMPLES[0]
check(oct.file === '2026-10-04_mosport_150240_best-110909.xrk', `newest sample file ${oct.file}`)
check(oct.setup.rearTeeth === 69 && oct.setup.frontTeeth === undefined, 'Oct 4: 69T rear, front unknown (never assumed)')
check(oct.setup.coldPsi?.rl === 11 && oct.setup.tireCompound === 'Vega White' && oct.setup.intentionalChange === 'gearing', 'Oct 4: Vega White, cold 11 psi, intentional change gearing')
for (const old of ['2026-10-03_mosport_150240_best-110909.xrk', 'Mosport · Oct 3 2026 · 15:02.xrk']) {
  check(sampleGearing(old)?.rearTeeth === 69, `old name "${old}" → 69T`)
  check(findSample(old)?.file === oct.file, `old name "${old}" dedupes with the current sample`)
}
check(REAL_SAMPLES.filter((s) => s.setup.rearTeeth === 67).length === 2, 'Sep samples → 67T')
check(sampleSetup('my-own-session.xrk') === undefined, 'non-sample file gets no seed')
if (failed) {
  console.log(`\n${failed} sample check(s) failed.`)
  process.exit(1)
}
console.log('\nAll sample smoke checks passed.')

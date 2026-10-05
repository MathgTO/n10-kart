/**
 * Bundled-sample identity: Oct 4 sample (logger clock one day behind → logger wrote Oct 3).
 * Run: npx --yes tsx --tsconfig tsconfig.app.json scripts/smoke-samples.mts
 * Checks: file exists under the new name, +1 day override → Oct 4, old names/labels still map to 69T
 * and migrate to the current title/file name (so re-import dedupes instead of duplicating).
 */
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findSample, REAL_SAMPLES, sampleGearing, sampleIdentity, shiftDate } from '../src/lib/samples'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
let failed = 0
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${msg}`)
  if (!ok) failed++
}
for (const s of REAL_SAMPLES) check(existsSync(join(root, 'public/samples', s.file)), `public/samples/${s.file} exists`)
const oct = REAL_SAMPLES[0]
check(oct.file === '2026-10-04_mosport_150240_best-110909.xrk', `newest sample file ${oct.file}`)
check(oct.label === 'Mosport · Oct 4 2026 · 15:02', `label ${oct.label}`)
check(oct.loggerDate === '2026-10-03' && oct.dateOffsetDays === 1, 'logger date Oct 3 + 1 day')
check(oct.recordedAt === '2026-10-04T15:02:40', `recordedAt ${oct.recordedAt}`)
check(shiftDate('2026-09-30', 1) === '2026-10-01' && shiftDate('2026-12-31', 1) === '2027-01-01', 'shiftDate rolls month/year')
for (const old of ['2026-10-03_mosport_150240_best-110909.xrk', 'Mosport · Oct 3 2026 · 15:02.xrk']) {
  check(sampleGearing(old)?.rearTeeth === 69, `old name "${old}" → 69T`)
  const id = sampleIdentity(old)
  check(id?.title === oct.label && id?.sourceFileName === oct.displayName && id?.recordedAt === '2026-10-04T15:02:40', `old name "${old}" migrates to Oct 4 title/file/date`)
  check(findSample(old)?.file === oct.file, `old name "${old}" dedupes with the current sample`)
}
check(sampleGearing(oct.displayName)?.rearTeeth === 69 && sampleGearing(oct.file)?.rearTeeth === 69, 'new names → 69T')
check(REAL_SAMPLES.filter((s) => s.gearing.rearTeeth === 67).length === 2, 'Sep 25 samples → 67T')
check(sampleIdentity('my-own-session.xrk') === undefined, 'non-sample file untouched')
if (failed) {
  console.log(`\n${failed} sample check(s) failed.`)
  process.exit(1)
}
console.log('\nAll sample smoke checks passed.')

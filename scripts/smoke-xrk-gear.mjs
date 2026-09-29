/**
 * Parse Mosport Sep 25 sample .xrks with N10 parseXrkFile + gearRatio mirror
 * (rpm-at-peak-speed pairing). Run: npx --yes tsx scripts/smoke-xrk-gear.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const samples = join(root, 'public/samples')

const EXIT_RPM_BAND = { lo: 5800, hi: 6100 }
const GEAR_ASSUMPTIONS = {
  driverTeeth: 17,
  tireDiameterM: 0.28,
  toothDelta17: 1 / 17,
}

function wheelRpmAtSpeed(speedKmh, tireDiameterM) {
  return ((speedKmh / 3.6) / (Math.PI * tireDiameterM)) * 60
}
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

/** Mirror of src/lib/gearRatio.ts suggestGearRatio (EXIT_RPM_BAND from rubric). */
function suggestGearRatio(input) {
  const peakRpm = input.maxRpm
  const peakSpeedKmh = input.maxSpeedKmh
  if (
    peakRpm == null ||
    peakSpeedKmh == null ||
    !Number.isFinite(peakRpm) ||
    !Number.isFinite(peakSpeedKmh) ||
    peakRpm < 3000 ||
    peakSpeedKmh < 20
  ) {
    return null
  }
  const { driverTeeth, tireDiameterM, toothDelta17 } = GEAR_ASSUMPTIONS
  const wRpm = wheelRpmAtSpeed(peakSpeedKmh, tireDiameterM)
  if (wRpm < 50) return null
  const estimatedCurrentRatio = peakRpm / wRpm
  const idealLo = EXIT_RPM_BAND.lo / wRpm
  const idealHi = EXIT_RPM_BAND.hi / wRpm
  const idealRatio = ((EXIT_RPM_BAND.lo + EXIT_RPM_BAND.hi) / 2 + 50) / wRpm
  const toothDelta = Math.round((idealRatio - estimatedCurrentRatio) / toothDelta17)
  let action = 'hold'
  if (toothDelta >= 1 || (input.exitRpm != null && input.exitRpm < EXIT_RPM_BAND.lo - 50)) {
    action = 'plus'
  } else if (toothDelta <= -1 || peakRpm >= EXIT_RPM_BAND.hi - 20) {
    action = 'minus'
  }
  if (peakRpm >= 6080) action = 'minus'
  if (input.exitRpm != null && input.exitRpm < 5700 && peakRpm < 6000) action = 'plus'
  const suggestedRearTeeth = {
    lo: clamp(Math.round(idealLo * driverTeeth), 60, 80),
    hi: clamp(Math.round(idealHi * driverTeeth), 60, 80),
    center: clamp(Math.round(idealRatio * driverTeeth), 60, 80),
  }
  const curTeeth = Math.round(estimatedCurrentRatio * driverTeeth)
  const absTeeth = Math.max(1, Math.abs(toothDelta) || 1)
  const deltaLabel =
    action === 'plus'
      ? `Recommend +${absTeeth} rear tooth`
      : action === 'minus'
        ? `Recommend −${absTeeth} rear tooth`
        : 'Hold'
  return {
    peakSpeedKmh,
    peakRpm,
    toothDelta,
    action,
    estimatedCurrentRatio,
    idealRatio,
    suggestedRearTeeth,
    summary: `Est ~${estimatedCurrentRatio.toFixed(2)} (≈${curTeeth}T). Ideal ~${idealLo.toFixed(2)}–${idealHi.toFixed(2)}. ${deltaLabel}.`,
  }
}

function rpmAtPeakSpeed(laps) {
  let maxSpeed = -1
  let rpmAtPeak
  for (const lap of laps) {
    for (const s of lap.samples) {
      if (
        Number.isFinite(s.speed) &&
        Number.isFinite(s.rpm) &&
        s.speed > maxSpeed &&
        s.speed >= 20 &&
        s.rpm >= 3000
      ) {
        maxSpeed = s.speed
        rpmAtPeak = s.rpm
      }
    }
  }
  if (maxSpeed < 0 || rpmAtPeak == null) return {}
  return { maxSpeed, rpmAtPeak }
}

function formatLap(ms) {
  const s = ms / 1000
  const m = Math.floor(s / 60)
  const rem = (s - m * 60).toFixed(3)
  return `${m}:${rem.padStart(6, '0')}`
}

async function analyze(fileName, expectBestMs, expectLapNum) {
  const { parseXrkFile } = await import(pathToFileURL(join(root, 'src/lib/xrk.ts')).href)
  const buf = readFileSync(join(samples, fileName))
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  const parse = await parseXrkFile(new File([buf], fileName), ab)
  console.log('\n===', fileName)
  console.log('ok:', parse.ok, '|', parse.message)
  const flying = parse.laps.filter((l) => l.timeMs >= 45000 && l.timeMs <= 180000)
  const pool = flying.length ? flying : parse.laps
  const best = pool.reduce((a, b) => (a.timeMs <= b.timeMs ? a : b))
  console.log(
    'best:',
    formatLap(best.timeMs),
    'lapNumber=',
    best.lapNumber,
    '| expect',
    formatLap(expectBestMs),
    'L' + expectLapNum,
    '| timeMatch',
    Math.abs(best.timeMs - expectBestMs) < 2,
    '| lapMatch',
    best.lapNumber === expectLapNum
  )
  const peak = rpmAtPeakSpeed(parse.laps)
  const gear = suggestGearRatio({
    maxRpm: peak.rpmAtPeak ?? best.maxRpm,
    maxSpeedKmh: peak.maxSpeed ?? best.maxSpeed,
    exitRpm: best.exitRpmFocus,
  })
  console.log('rpm@peakSpeed:', {
    maxSpeedKmh: peak.maxSpeed,
    rpmAtPeak: peak.rpmAtPeak,
    exitRpmFocus: best.exitRpmFocus,
  })
  console.log('gear:', gear)
  return { best, peak, gear }
}

await analyze('2026-09-25_mosport_163712_best-108294.xrk', 68294, 9)
await analyze('2026-09-25_mosport_143726_best-108241.xrk', 68241, 7)

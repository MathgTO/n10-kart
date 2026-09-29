/**
 * Smoke test for Race Studio CSV parser.
 * Runs via: npx --yes tsx scripts/smoke-csv.mjs
 * (tsx can execute .ts imports from this entry after we use dynamic import of csv.ts)
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const fixtures = join(root, 'src/lib/__fixtures__')

async function main() {
  // Prefer tsx-resolved TS module
  const csvUrl = pathToFileURL(join(root, 'src/lib/csv.ts')).href
  const { parseCsvText } = await import(csvUrl)

  let failed = 0

  function assert(cond, msg) {
    if (!cond) {
      console.error('FAIL:', msg)
      failed++
    } else {
      console.log('OK:', msg)
    }
  }

  // --- sample stream ---
  const streamText = readFileSync(join(fixtures, 'rs3-sample-stream.csv'), 'utf8')
  const stream = parseCsvText(streamText, 'rs3-sample-stream.csv')
  assert(stream.ok, `sample-stream ok=${stream.ok}`)
  assert(stream.laps.length >= 2, `sample-stream laps>=2 got ${stream.laps.length}`)
  assert(stream.channels.speed, 'sample-stream speed channel')
  assert(stream.channels.rpm, 'sample-stream rpm channel')
  assert(
    Array.isArray(stream.recognizedUnused) && stream.recognizedUnused.some((c) => /water|thr/i.test(c)),
    `sample-stream notes unused temps/throttle: ${JSON.stringify(stream.recognizedUnused)}`
  )
  console.log('  message:', stream.message)

  // --- lap summary ---
  const lapText = readFileSync(join(fixtures, 'rs3-lap-summary.csv'), 'utf8')
  const laps = parseCsvText(lapText, 'rs3-lap-summary.csv')
  assert(laps.ok, `lap-summary ok=${laps.ok}`)
  assert(laps.laps.length === 5, `lap-summary 5 laps got ${laps.laps.length}`)
  assert(laps.channels.lapTimes, 'lap-summary lapTimes')
  assert(
    laps.message.includes('sectors') || (laps.laps[0].sectorLossMs?.length ?? 0) >= 1,
    `lap-summary sectors recognized: ${laps.message}`
  )
  console.log('  message:', laps.message)
  console.log(
    '  best ms:',
    Math.min(...laps.laps.map((l) => l.timeMs)),
    'first sectorLossMs:',
    laps.laps[0].sectorLossMs
  )

  if (failed) {
    console.error(`\n${failed} assertion(s) failed`)
    process.exit(1)
  }
  console.log('\nAll CSV smoke checks passed.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

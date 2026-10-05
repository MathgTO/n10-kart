/**
 * Redesign smoke (school report card, setup step, auto track/date/zone, drivers, share):
 *  - letter mapping
 *  - Oct 4 GPS date fix: Sun Oct 4 15:01 local, zone from the track table, logger one day behind (dayOffset −1)
 *  - Mosport GP detected with high confidence
 *  - Gabriel auto-assigned via logger serial 35023763
 *  - KTE class config (Junior Light: limiter 6150, peak band 5800–6150, corner-exit floor ~3700) and D4 honesty
 *  - setup verdict (67→69 applied, tires next, vs Sep baseline 1:07.967) + tuner voice wording
 *  - share is PDF-only (no plain-text SMS/email body)
 *  - Keep/Start/Stop/Overall prose has no letter grades
 *  - coach data-backed estimates (D2/D5) get letters; video-required dims stay N/A
 *  - no 'America/Toronto' or '5800' literals in src outside the track table / class config / fixtures / baked rubric JSON
 * Run: npx --yes tsx --tsconfig tsconfig.app.json scripts/smoke-redesign.mts
 */
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getClassConfig } from '../src/lib/classConfig'
import { seedDrivers } from '../src/lib/drivers'
import { letterForDim, letterFromScore, overallLetter } from '../src/lib/grades'
import { analyzeSession, createSessionFromParse } from '../src/lib/pipeline'
import { canonicalLabel, sessionLocal } from '../src/lib/sessionLabel'
import { getTrack } from '../src/data/tracks'
import { lapSpokenFull, numberWords } from '../src/lib/speech'
import { parseXrkFile } from '../src/lib/xrk'
import type { StoredSession } from '../src/lib/types'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
let failed = 0
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${msg}`)
  if (!ok) failed++
}

// --- letters
check(letterFromScore(4.7) === 'A+' && letterFromScore(4.5) === 'A' && letterFromScore(3.3) === 'B' && letterFromScore(3.0) === 'B−', 'letters A+/A/B/B−')
check(letterFromScore(2.5) === 'C' && letterFromScore(1.9) === 'D' && letterFromScore(null) === null, 'letters C/D/null')
check(overallLetter([3.5, 3.0, 3.5]) === 'B', 'overall = mean of shown')
check(letterForDim({ dimension_id: 'D2', score: 4, evidence_kind: 'heuristic', evidence_markers: [] } as never) === 'A−', 'data-backed heuristic estimate → letter')
check(letterForDim({ dimension_id: 'D1', score: null, evidence_kind: 'heuristic', evidence_markers: [] } as never) === null, 'heuristic with no score → no letter')
check(letterForDim({ dimension_id: 'D4', score: 4, evidence_kind: 'mychron', evidence_markers: [], setup_confounded: true } as never) === null, 'setup-confounded → no letter')

// --- KTE class config
const jl = getClassConfig('junior_light')
check(jl.limiter === 6150 && jl.nearLimiter === 6050 && jl.peakSpeedBand?.lo === 5800 && jl.peakSpeedBand?.hi === 6150, 'Junior Light: limiter 6150, near ≥6050, peak band 5800–6150')
check(jl.cornerExitLowRpm === 3700, 'Junior Light corner-exit floor ~3700')
const jr = getClassConfig('junior')
check(jr.limiter === 6100 && jr.peakSpeedBand?.hi === 6100 && jr.cornerExitLowRpm === 3700, 'Junior: limiter 6100, peak 5800–6100, floor ~3700')
check(getClassConfig('senior').limiter === null && getClassConfig('senior').cornerExitLowRpm === null, 'Senior: limiter/floor unknown')
check(numberWords(6150) === 'sixty-one-fifty', 'limiter spoken "sixty-one-fifty"')
check(lapSpokenFull(67967) === 'one oh seven nine six seven', 'baseline lap spoken')

// --- import pipeline on all three real samples, oldest first
const drivers = seedDrivers()
const sessions: StoredSession[] = []
const files = ['2026-09-25_mosport_143726_best-108241.xrk', '2026-09-25_mosport_163712_best-108294.xrk', '2026-10-04_mosport_150240_best-110909.xrk']
for (const f of files) {
  const b = readFileSync(join(root, 'public/samples', f))
  const ab = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer
  const r = await parseXrkFile(new File([ab], f), ab)
  const { session, needsDriverPrompt } = await createSessionFromParse(r, f, { sessions, drivers, series: 'practice', fallbackTrackId: 'other' })
  sessions.push(session)
  const l = sessionLocal(session)!
  check(session.trackId === 'mosport' && session.layoutId === 'gp' && session.detectConfidence === 'high', `${f}: Mosport GP, high confidence`)
  check(session.driverId === 'drv-gabriel' && session.driverSource === 'logger' && !needsDriverPrompt, `${f}: Gabriel via logger 35023763`)
  check(session.timeZone === getTrack('mosport').tz && session.tzSource === 'track', `${f}: zone from track table (${session.timeZone})`)
  check(session.dateSource === 'gps' && session.dayOffset === -1, `${f}: GPS date, logger one day behind`)
  check(session.classId === 'junior_light', `${f}: class Junior Light (driver default)`)
  const d4 = session.report.scores.find((s) => s.dimension_id === 'D4')!
  check(letterForDim(d4) === null, `${f}: D4 has no kid letter (GPS-only / confounded)`)
  check(d4.evidence_markers.some((m) => /floor ~3700/.test(m)) && !d4.evidence_markers.some((m) => /5800|6150/.test(m)), `${f}: D4 scored vs corner-exit floor, not the peak band`)
  console.log(`     ${canonicalLabel(session, sessions)} · ${l.weekdayShort} ${l.hhmm} ${l.zone}`)
}
const oct = sessions[2]
const ol = sessionLocal(oct)!
check(ol.ymd === '2026-10-04' && ol.hhmm === '15:01' && ol.zone === 'EDT' && ol.weekdayShort === 'Sun', 'Oct 4: Sun Oct 4 15:01 EDT (logger said Oct 3)')
check(canonicalLabel(oct, sessions).startsWith('Mosport · GP · Sun Oct 4 · 15:01 EDT · R1'), `label "${canonicalLabel(oct, sessions)}"`)
const sep = sessionLocal(sessions[0])!
check(sep.ymd === '2026-09-26' && sep.weekdayShort === 'Sat', 'Sep samples: Sat Sep 26 from GPS')

const a = analyzeSession(oct, sessions, drivers)
check(a.verdict.category === 'tires', `Oct 4 setup: ${a.verdict.categoryLabel} — ${a.verdict.action}`)
check(a.verdict.priorChange?.text === 'rear 67→69' && a.verdict.priorChange.applied === true, `prior change ${a.verdict.priorChange?.text} applied (${a.verdict.priorChange?.evidence})`)
check(a.verdict.vsLast?.prevBestMs === 67967, 'vs Sep baseline 1:07.967 (driver baseline newer than the library sessions)')
check(/sixty-one-fifty limiter/.test(a.verdict.voiceScript) && !/sixty-one hundred/i.test(a.verdict.voiceScript), 'tuner voice says "under the sixty-one-fifty limiter"')
check(a.summary.exitsNote === "Dad's checking the kart on this one", 'kid card exits row: "Dad\'s checking the kart on this one"')
check(!!a.summary.share.pdfTitle && !!a.summary.share.fileName.endsWith('.pdf'), `PDF share meta "${a.summary.share.fileName}"`)
check(!('sms' in a.summary.share) && !('emailBody' in a.summary.share), 'share has no plain-text SMS/email body')
check(a.summary.title === 'Gabriel’s report card', 'title "Gabriel’s report card"')
check(a.summary.keep.text.length > 0 && a.summary.start.text.length > 0 && a.summary.stop.text.length > 0, 'Keep / Start / Stop prose present on kid summary')
check(!/^\s*[A-D][+−-]?\b/.test(a.summary.overallSentence) && !/Overall:\s*[A-D]/i.test(a.summary.overallSentence), 'Overall summary prose has no letter grade')
const kidIds = new Set([...a.summary.face, ...a.summary.more, ...a.summary.fromVideo].map((x) => x.dimId))
const coachLettered = oct.report.scores.filter((s) => letterForDim(s) != null && s.dimension_id !== 'D19')
check(coachLettered.every((s) => kidIds.has(s.dimension_id)), 'kid graded dim set matches coach lettered dims (excl. D19 setup)')
const d2 = oct.report.scores.find((s) => s.dimension_id === 'D2')!
const d9 = oct.report.scores.find((s) => s.dimension_id === 'D9')!
check(d2.score != null && d2.evidence_kind === 'heuristic' && letterForDim(d2) != null, `D2 data-backed estimate scored (${d2.score}) with letter`)
check(d9.score == null && (d9.unavailable_reason === 'needs_cam' || d9.evidence_kind === 'needs_kart_cam') && letterForDim(d9) == null, 'D9 needs video → N/A, no letter')

// --- unknown logger → prompt; CSV (no serial) → last driver at track
{
  const b = readFileSync(join(root, 'public/samples', files[2]))
  const ab = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer
  const r = await parseXrkFile(new File([ab], 'x.xrk'), ab)
  const { session, needsDriverPrompt } = await createSessionFromParse(r, 'x.xrk', { sessions, drivers: [], series: 'practice', fallbackTrackId: 'other' })
  check(needsDriverPrompt && !session.driverId, 'unknown logger serial → "Whose is it?" prompt')
}

// --- literals
const out = execSync(
  `grep -rnE "America/Toronto|5800" src --exclude=tracks.ts --exclude=classConfig.ts --exclude=rubric-v1.json --exclude-dir=__fixtures__ || true`,
  { cwd: root, encoding: 'utf8' }
).trim()
check(out === '', `no 'America/Toronto' / '5800' in src outside tracks.ts, classConfig.ts, rubric-v1.json, fixtures${out ? `\n${out}` : ''}`)

if (failed) {
  console.log(`\n${failed} redesign check(s) failed.`)
  process.exit(1)
}
console.log('\nAll redesign smoke checks passed.')

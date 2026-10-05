/**
 * ONE generated driver summary per session. The school report sections, the driver voice script,
 * the Start-doing focus text and the share PDF all come from this object.
 * Honesty: only measured, non-confounded dimensions get letters; heuristic estimates never do.
 * Driving only — setup lives in the setup verdict (setupVerdict.ts). Never blames the driver for kart issues.
 */
import { getTrack } from '@/data/tracks'
import { dimGrade, overallLetter, type Letter } from './grades'
import { getDrill } from './rubric'
import { lapShort, lapSpokenShort, numberWords } from './speech'
import { lapValidity } from './telemetry'
import type { SetupVerdict } from './setupVerdict'
import type { DimensionId, DimensionScore, DriverProfile, StoredSession } from './types'

/** Kid labels (never D-codes). D19 Tire is not a kid grade — it lives on the setup card. */
export const KID_LABELS: Record<string, string> = {
  D1: 'Using the whole track',
  D2: 'When you turn in',
  D3: 'Hitting the apex',
  D4: 'Corner exits',
  D5: 'Hard braking',
  D6: 'Letting off the brake',
  D7: 'Same brake every lap',
  D8: 'Calm steering',
  D9: 'Quiet hands',
  D10: 'Smooth throttle',
  D11: 'Rotating the kart',
  D12: 'Looking ahead',
  D13: 'Body still in the seat',
  D14: 'Using the draft',
  D15: 'Passing',
  D16: 'Defending',
  D17: 'Start / lap 1',
  D18: 'Putting laps together',
  D20: 'Wet driving',
}

/** Adult (plain coach tone) labels. */
export const ADULT_LABELS: Record<string, string> = {
  D1: 'Track width',
  D2: 'Turn-in timing',
  D3: 'Apex placement',
  D4: 'Corner exits',
  D5: 'Brake pressure',
  D6: 'Brake release',
  D7: 'Brake consistency',
  D8: 'Steering smoothness',
  D9: 'Hands',
  D10: 'Throttle smoothness',
  D11: 'Rotation',
  D12: 'Vision',
  D13: 'Body position',
  D14: 'Drafting',
  D15: 'Passing',
  D16: 'Defending',
  D17: 'Starts / lap 1',
  D18: 'Lap consistency',
  D20: 'Wet driving',
}


/** One-line plain “what this is” under each skill (PDF + school card). */
export const KID_DESCS: Record<string, string> = {
  D1: 'Using the full width — not leaving unused track.',
  D2: 'Starting the turn at the right time — not too early.',
  D3: 'Right spot at mid-corner so you keep speed through the middle.',
  D4: 'Drive off the slow corners onto the next straight.',
  D5: 'Firm stop on the straight before you turn in.',
  D6: 'Easing off the brake clean so the kart rotates.',
  D7: 'Same braking marker lap after lap — no inventing a new spot.',
  D8: 'One clean turn of the wheel — not sawing.',
  D9: 'Quiet hands — no extra wiggles mid-corner.',
  D10: 'Rolling on the gas clean out of corners — not in steps.',
  D11: 'Getting the kart rotated so it points at the exit.',
  D12: 'Eyes up — looking where you want to go.',
  D13: 'Sitting still so the kart stays planted.',
  D14: 'Using the tow without bumping.',
  D15: 'Clean passes — own the inside, keep the exit.',
  D16: 'Defending without weaving or blocking.',
  D17: 'First lap composure off the start.',
  D18: 'Keeping flying laps close to your best — not bouncing around.',
  D20: 'Wet marks and patience when the track is slick.',
}

const RACECRAFT = new Set(['D14', 'D15', 'D16', 'D17'])

export interface Subject {
  dimId: DimensionId
  label: string
  /** null when the dim is shown as N/A (needs video / no data basis / setup context). */
  letter: Letter | null
  score: number | null
  why: string
  fromVideo: boolean
  /** Data-backed estimate (not hard MyChron / video measure). */
  estimate?: boolean
}

export interface DriverSummary {
  name: string
  kid: boolean
  title: string // "Gabriel's report card"
  /** Internal only — used for bad-day checks; never shown as a grade on Keep/Start/Stop/Overall. */
  overall: Letter | null
  overallSentence: string
  /** Same graded-dim set as Coach (measured + data-backed estimates), face first. */
  face: Subject[]
  /** Rest of the graded set, behind "More skills". */
  more: Subject[]
  /** Graded subjects that came from video (shown under "New from your video"). */
  fromVideo: Subject[]
  keep: { text: string; subject?: Subject }
  start: { text: string; drill: string; subject?: Subject; corner: string }
  stop: { text: string }
  /** D4 with a kart confound: no letter + this line. */
  exitsNote?: string
  unlockLine: string
  bestLap?: { ms: number; lapNumber: number; text: string; spoken: string }
  compareLap?: { ms: number; lapNumber: number; deltaMs: number }
  gpsOnly: boolean
  badDay: boolean
  voiceScript: string
  /** PDF share file name + short title for the native share sheet. */
  share: { pdfTitle: string; fileName: string }
}

function labelFor(id: string, kid: boolean): string {
  return (kid ? KID_LABELS : ADULT_LABELS)[id] ?? 'Driving'
}

/** "T12 Last" → { text: 'the last corner', short: 'last-corner', spoken: 'the last corner' } */
export function turnPhrase(cornerName: string | undefined): { text: string; short: string; title: string } {
  const n = cornerName ?? ''
  const m = /^T(\d+)\s*(.*)$/.exec(n.trim())
  const num = m ? Number(m[1]) : undefined
  const nick = (m?.[2] ?? '').toLowerCase()
  if (nick.includes('last')) return { text: 'the last corner', short: 'last-corner', title: 'Last corner' }
  if (nick.includes('hairpin')) return { text: `the hairpin (turn ${num != null ? numberWords(num) : ''})`.replace(' ()', ''), short: 'hairpin', title: 'Hairpin' }
  if (nick.includes('sweep')) return { text: 'the sweeper', short: 'sweeper', title: 'Sweeper' }
  if (num != null) return { text: `turn ${numberWords(num)}`, short: `turn ${num}`, title: `Turn ${num}` }
  return { text: 'the slow corner', short: 'slow-corner', title: 'Slow corner' }
}

function whyFor(id: string, s: DimensionScore, ctx: { closeByLap?: number; bestText?: string }, kid: boolean): string {
  const good = (s.score ?? 0) >= 3.5
  switch (id) {
    case 'D18':
      if (ctx.closeByLap) return `Building early — close by lap ${ctx.closeByLap}.${ctx.bestText ? ` ${ctx.bestText}` : ''}`
      if (good) return kid ? 'Your laps stacked up close together.' : 'Lap times stayed close to your ideal lap.'
      return kid ? 'Lap times jumped around — stack them closer.' : 'Lap-to-lap spread is wide; consistency is the gain.'
    case 'D10':
      if (good) return kid ? 'Smooth on the gas out of the slow corners.' : 'Throttle application stayed smooth through the exits.'
      return kid ? 'Throttle came on in steps out of the slow corners.' : 'Throttle pickup on exits was stepped, not progressive.'
    case 'D7':
      if (good) return kid ? 'Same braking spot lap after lap.' : 'Braking points repeated well lap to lap.'
      return kid ? 'Braking spot moved around from lap to lap.' : 'Braking points varied lap to lap.'
    case 'D4':
      if (good) return kid ? 'Strong drive off the slow corners.' : 'Good drive off the slow corners.'
      return kid ? 'Drive off the slow corners has room to grow.' : 'Exit drive from slow corners is below the class floor.'
    case 'D3':
      if (good) return kid ? 'Kept your speed through the middle of the corner.' : 'Minimum corner speed held up.'
      return kid ? 'Lost speed in the middle of the corner.' : 'Minimum corner speed is giving time away.'
    case 'D2':
      if (good) return kid ? 'Turn-in lined up with your best lap.' : 'Turn-in timing stayed close to your best lap.'
      return kid ? 'Turn-in drifted vs your best lap.' : 'Turn-in timing moved around vs your best lap.'
    case 'D5':
      if (good) return kid ? 'Hard enough on the brakes into the slow corners.' : 'Brake aggression into slow corners matched your best lap.'
      return kid ? 'Could squeeze harder on the brakes into the slow corners.' : 'Brake aggression into slow corners was softer than your best lap.'
    default:
      return s.notes ?? ''
  }
}

/** First full lap within 1% of the best lap (the "build"). */
function closeByLap(s: StoredSession): number | undefined {
  const best = s.laps[s.bestLapIndex]
  if (!best) return undefined
  const v = lapValidity(s.laps)
  const hit = s.laps.find((l, i) => v[i] === 'ok' && l.timeMs <= best.timeMs * 1.01)
  if (!hit || hit === best) return undefined
  return hit.lapNumber ?? hit.index + 1
}

export interface SummaryInput {
  session: StoredSession
  driver?: DriverProfile
  verdict: SetupVerdict
  /** Canonical label (for share headers). */
  label: string
  /** Short date ('Oct 4'). */
  date: string
  /** This driver's previous session at this track (bad-day check). */
  previous?: StoredSession | null
}

export function buildDriverSummary(input: SummaryInput): DriverSummary {
  const { session: s, driver, verdict } = input
  const name = driver?.displayName ?? 'Driver'
  const kid = driver ? driver.kidCard : true
  const track = getTrack(s.trackId)
  const report = s.report
  const wet = s.conditions === 'wet' || !!s.weather?.wet
  const race = s.series === 'race' || s.series === 'bsc_ontario' || s.series === 'mika' || s.series === 'qualifying'
  const best = s.laps[s.bestLapIndex]
  const cmp = s.referenceLapIndex !== s.bestLapIndex ? s.laps[s.referenceLapIndex] : undefined
  const bestNum = best ? best.lapNumber ?? best.index + 1 : 0
  const bestLap = best
    ? { ms: best.timeMs, lapNumber: bestNum, text: `${lapShort(best.timeMs)} Lap ${bestNum}`, spoken: lapSpokenShort(best.timeMs) }
    : undefined
  const close = closeByLap(s)
  const bestText = bestLap ? `Best ${lapShort(bestLap.ms)} on lap ${bestLap.lapNumber}.` : undefined

  // Same graded-dim set as Coach: measured + data-backed estimates with letters.
  // D19 stays on the setup card (never a kid grade). D20 wet-only. Racecraft race-only.
  // Setup-confounded / needs-video / no-basis stay out of the lettered set (kid shows N/A only via unlock/video).
  const graded: Subject[] = []
  for (const sc of report.scores) {
    const id = sc.dimension_id
    if (id === 'D19') continue
    if (id === 'D20' && !wet) continue
    if (RACECRAFT.has(id) && !race) continue
    const g = dimGrade(sc)
    if (g.letter == null || g.score == null) continue
    graded.push({
      dimId: id,
      label: labelFor(id, kid),
      letter: g.letter,
      score: g.score,
      why: whyFor(id, sc, { closeByLap: close, bestText }, kid),
      fromVideo: sc.evidence_kind === 'kart_cam',
      estimate: g.status === 'estimate',
    })
  }
  // Order: Briggs/RCA pit order for MyChron subjects, then other data estimates, video after.
  const order = ['D18', 'D4', 'D10', 'D3', 'D7', 'D2', 'D5']
  graded.sort((a, b) => {
    if (a.fromVideo !== b.fromVideo) return a.fromVideo ? 1 : -1
    const ia = order.indexOf(a.dimId)
    const ib = order.indexOf(b.dimId)
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
  })
  const logger = graded.filter((g) => !g.fromVideo)
  const fromVideo = graded.filter((g) => g.fromVideo)
  const face = logger.slice(0, 3)
  const more = logger.slice(3)
  const shown = [...face, ...fromVideo]
  const overall = overallLetter(shown.map((g) => g.score).filter((n): n is number => n != null))

  const d4 = report.scores.find((x) => x.dimension_id === 'D4')
  const exitsNote =
    d4 && verdict.exitsConfounded && d4.score != null
      ? kid
        ? "Dad's checking the kart on this one"
        : 'Kart setup is the likely limiter on exits — see the setup card'
      : undefined

  // Bad day: overall C or below, or ≥2% slower than this driver's last session here.
  const prevBest = input.previous?.laps[input.previous.bestLapIndex]
  const slower = prevBest && best ? (best.timeMs - prevBest.timeMs) / prevBest.timeMs >= 0.02 : false
  const lowOverall = overall != null && ['C+', 'C', 'C-', 'D'].includes(overall)
  const badDay = lowOverall || (!!slower && overall == null)

  // Keep doing: strengths ≥4, else best shown — serious you-voice.
  const strengths = [...shown].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 2)
  const keepSubject = strengths.find((g) => (g.score ?? 0) >= 4) ?? strengths[0]
  let keepText = keepSubject ? keepSubject.why : close ? `Building early — close by lap ${close}.` : kid ? 'You kept pushing all session.' : 'Steady effort through the session.'
  if (strengths[1] && (strengths[1].score ?? 0) >= 3.5 && strengths[1].why && strengths[1].why !== keepText) keepText += ` ${strengths[1].why}`
  if (badDay && !keepSubject) keepText = close ? `Building early — close by lap ${close}.` : kid ? 'You kept working all session — that effort counts.' : 'Effort and the build-up were there.'

  // Start doing / Next focus: active priority.
  // When priority is D3 (apex), ALL copy (Start/Stop/Overall/Voice/Drill) talks apex commitment —
  // not exit-only and not the rubric's generic later_turn_in drill name.
  // Prefer EXIT commitment on corner loss only when priority is not D3.
  const corner = turnPhrase(report.focus.cornerName)
  const drill = getDrill(report.primary_drill.id)
  const priorityId = report.priority_dimension_id
  const apexWork = priorityId === 'D3'
  const startSubject = shown.find((g) => g.dimId === priorityId) ?? face.find((g) => g.dimId === 'D4')
  const focusIsCorner = report.focus.referenceLapIndex !== report.focus.bestLapIndex && report.focus.lossMs > 40
  const exitsWork = focusIsCorner && !apexWork
  const briggsStart: Partial<Record<string, string>> = {
    D4: 'Get on the gas earlier out of the slow corners. The blue slide rewards exit, not living on 6150.',
    D2: 'Wait one kart length longer before you turn. Late apex = faster onto the straight.',
    D8: 'One clean turn of the wheel. Sawing scrub costs you more than a faster driver in this class.',
    D9: 'One clean turn of the wheel. Sawing scrub costs you more than a faster driver in this class.',
    D14: "Close up for the tow, but don't bump. A push gets a 5-second bumper penalty.",
    D15: 'Own the inside before turn-in, and keep the exit. Contact that costs someone a spot is a bad pass — officials can drop you behind them.',
    D3: 'Commit to the apex. One clean hit mid-corner unlocks the exit — no early stab.',
  }
  let startText: string
  if (kid && briggsStart[priorityId]) {
    startText = exitsWork && priorityId !== 'D4'
      ? `Get on the gas earlier out of the slow corners. The blue slide rewards exit, not living on 6150.`
      : briggsStart[priorityId]!
    // Corner-loss sessions: lock EXIT unless priority is truly apex (D3).
    if (exitsWork) {
      startText = `${corner.title} exit — get on the gas earlier. The blue slide rewards exit, not living on 6150.`
    } else if (apexWork) {
      startText = briggsStart.D3!
    }
  } else if (exitsWork) {
    startText = kid
      ? `${corner.title} exit — get on the gas earlier and push all the way out. The blue slide rewards exit, not living on 6150.`
      : `${corner.title}: turn in a touch later, get to full throttle earlier and use all the exit.`
  } else if (apexWork) {
    startText = briggsStart.D3!
  } else {
    startText = kid
      ? `${drill?.name ?? 'Pick your marks'} — ${drill?.instruction ?? 'same marks every lap.'}`
      : `${drill?.name ?? 'Reference points'}: ${drill?.instruction ?? 'repeat your marks every lap.'}`
  }
  const drillText = exitsWork
    ? `${corner.title} exit: same entry, wait to turn, earlier throttle`
    : apexWork
      ? 'Commit to the apex — one clean hit mid-corner, no early stab'
      : priorityId === 'D2'
        ? 'Wait one kart length longer before you turn — then commit'
        : drill?.name ?? 'Same marks every lap'

  // Stop doing: contact / weaving / bump-draft when race; else one habit to cut.
  const losses = s.corners.map((c) => Math.max(0, c.lossMs ?? 0))
  const totalLoss = losses.reduce((a, b) => a + b, 0)
  const concentrated = focusIsCorner && totalLoss > 0 && report.focus.lossMs / totalLoss >= 0.4
  const stopText = race
    ? "Don't bump-draft or weave. A push gets a bumper penalty — close up for the tow, keep it clean."
    : concentrated
      ? apexWork
        ? 'Stabbing early at the apex. Wait for it — one clean hit mid-corner unlocks the exit.'
        : 'Reinventing the whole lap when one corner is the issue. Same entry; only change the exit.'
      : apexWork
        ? 'Early stab at the apex. Let it come to you — commit once mid-corner.'
        : priorityId === 'D7'
          ? 'Moving your braking marker around. Pick one board and stick to it.'
          : 'Changing your line every lap. Pick your marks and repeat them.'

  // Overall: serious craft lock — no "homework", no soft pride fluff. D3 → apex, not later-turn-in drill name.
  const lockPhrase = exitsWork
    ? `the ${corner.short} exit`
    : apexWork
      ? 'apex commitment'
      : (drill?.name ?? 'your marks').toLowerCase()
  const overallSentence = overall
    ? kid
      ? `${badDay ? 'Tough outing — you stayed in it' : 'Solid build'}. Lock ${lockPhrase} next round and the tenths come with you.`
      : `${badDay ? 'Tough outing, real effort' : 'Solid build'}. Lock ${lockPhrase} next round.`
    : `Not enough measured skills to summarize the outing yet.${kid ? " Dad owns the kart checklist." : ''}`

  // ---- driver voice (~45 s, RCA style) ----
  const v: string[] = [`${name}.`]
  if (bestLap) v.push(`Best lap was a ${bestLap.spoken} on lap ${numberWords(bestLap.lapNumber)}.`)
  if (close) v.push(`${badDay ? 'Good effort' : "That's a solid build"} — by lap ${numberWords(close)} you were already close, so you're finding the kart early.`)
  else if (keepSubject) v.push(`${keepSubject.why}`)
  if (exitsWork) {
    const tenths = Math.round(report.focus.lossMs / 100)
    v.push(
      `What cost you today was ${corner.text}. You're leaving time on the exit${
        tenths >= 1 ? `, about ${tenths === 1 ? 'a tenth' : `${numberWords(tenths)}-tenths`} versus your own best` : ''
      }.`
    )
    v.push(`Next round, one job: get on the gas earlier out of ${corner.text}. Same entry, wait a beat, then commit — the blue slide rewards exit, not living on the limiter.`)
  } else if (apexWork) {
    v.push('Next round, one job: commit to the apex. One clean hit mid-corner unlocks the exit — no early stab.')
  } else if (priorityId === 'D2') {
    v.push('Next round, one job: wait one kart length longer before you turn. Late apex means faster onto the straight.')
  } else if (priorityId === 'D8' || priorityId === 'D9') {
    v.push('Next round, one job: one clean turn of the wheel. Sawing scrub costs you more than a faster driver in this class.')
  } else {
    v.push(`Next round, one job: ${drill?.instruction ?? 'same marks every lap.'}`)
  }
  if (concentrated) v.push(apexWork ? "Don't reinvent the rest of the lap — just the apex." : "Don't reinvent the rest of the lap.")
  if (exitsNote) v.push(kid ? "On exits, the kart side may be part of it — Dad's on that." : 'On exits, the kart may be part of it — check with the tuner.')
  v.push(exitsWork ? 'Lock that exit, and the time comes with it.' : apexWork ? 'Lock the apex next round.' : 'Lock the marks next round.')
  const voiceScript = v.join(' ')

  // ---- share: PDF report card only (native share sheet attaches the file)
  const pdfTitle = `${name}’s report card — ${input.label}`
  const fileName = `${name.replace(/[^\w.-]+/g, '_')}_report_card.pdf`


  return {
    name,
    kid,
    title: `${name}’s report card`,
    overall,
    overallSentence,
    face,
    more,
    fromVideo,
    keep: { text: keepText, subject: keepSubject },
    start: { text: startText, drill: drillText, subject: startSubject, corner: corner.title },
    stop: { text: stopText },
    exitsNote,
    unlockLine: 'More subjects unlock when you add video',
    bestLap,
    compareLap: cmp && best ? { ms: cmp.timeMs, lapNumber: cmp.lapNumber ?? cmp.index + 1, deltaMs: cmp.timeMs - best.timeMs } : undefined,
    gpsOnly: verdict.gpsOnly,
    badDay,
    voiceScript,
    share: { pdfTitle, fileName },
  }
}

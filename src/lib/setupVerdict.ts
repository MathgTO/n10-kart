/**
 * ONE setup verdict object per session → the teal Setup card and the tuner voice (single source).
 * Kart Tuning Expert rules: one setup category per outing (gearing | clutch | tires | chassis | none);
 * setup and driver advice never mix; never invent PSI / weight; GPS speed labelled; gearing is not weather-driven.
 */
import { getTrack } from '@/data/tracks'
import { getClassConfig } from './classConfig'
import { buildHealthDiagnosticFromSession, rpmAtPeakSpeed } from './healthDiagnostic'
import { formatLapTime } from './format'
import { lapSpokenFull, numberWords, ordinalWords, psiWords } from './speech'
import { sessionStartUtc, sessionLocal } from './sessionLabel'
import type { DriverBaseline, IntentionalChange, SessionSetup, StoredSession } from './types'

export type SetupCategory = Exclude<IntentionalChange, 'none'> | 'none'

export interface SetupVerdict {
  category: SetupCategory
  /** e.g. 'Tires' */
  categoryLabel: string
  /** e.g. 'start 11.5–12 psi cold, log hot' */
  action: string
  /** Spoken version of the action. */
  actionSpoken: string
  hold: SetupCategory[]
  holdLabel: string
  why: string
  /** Prior change (vs this driver's last session at this track + class). */
  priorChange?: {
    category: SetupCategory
    text: string // 'rear 67→69'
    applied: boolean | null
    evidence?: string // '+3.0% revs per km/h'
    spoken?: string
  }
  /** Peak RPM vs limiter (straight-line story). */
  limiterLine?: string
  limiterSpoken?: string
  underLimiter?: boolean
  gpsOnly: boolean
  classLabel: string
  classLine: string
  /** Driver's exits are explained by the kart this outing → D4 context only, no letter. */
  exitsConfounded: boolean
  vsLast?: { prevBestMs: number; deltaMs: number; prevDate: string; prevDateSpoken: string }
  weatherLine?: string
  /** KTE blank labels for missing setup fields. */
  blanks: string[]
  preCheck: string
  confidence: 'high' | 'medium' | 'low'
  /** ~35 s tuner voice script. */
  voiceScript: string
}

const CAT_LABEL: Record<SetupCategory, string> = {
  gearing: 'Gearing',
  clutch: 'Clutch',
  tires: 'Tires',
  chassis: 'Chassis',
  none: 'No change',
}

function avg(xs: (number | undefined)[]): number | undefined {
  const v = xs.filter((x): x is number => x != null && Number.isFinite(x))
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : undefined
}

export function coldPsiRear(setup?: SessionSetup): number | undefined {
  return avg([setup?.coldPsi?.rl, setup?.coldPsi?.rr]) ?? avg([setup?.coldPsi?.fl, setup?.coldPsi?.fr])
}

function fmtPsi(p: number): string {
  return Number.isInteger(p) ? String(p) : p.toFixed(1)
}

/** Clutch is no longer part of round setup — drop legacy clutch fields so they never carry over or drive a verdict. */
export function withoutClutch(setup: SessionSetup): SessionSetup {
  const { clutchEngagementRpm: _rpm, clutchId: _id, ...rest } = setup
  return rest.intentionalChange === 'clutch' ? { ...rest, intentionalChange: undefined } : rest
}

export function setupOf(s: StoredSession): SessionSetup {
  return s.setup ? withoutClutch(s.setup) : { rearTeeth: s.gearing?.rearTeeth, frontTeeth: s.gearing?.frontTeeth }
}

/** Fields that differ from the previous session's setup. */
export function changedFields(cur: SessionSetup, prev?: SessionSetup): string[] {
  if (!prev) return []
  const out: string[] = []
  if (cur.rearTeeth != null && prev.rearTeeth != null && cur.rearTeeth !== prev.rearTeeth) out.push('rearTeeth')
  if (cur.frontTeeth != null && prev.frontTeeth != null && cur.frontTeeth !== prev.frontTeeth) out.push('frontTeeth')
  if (cur.tireCompound && prev.tireCompound && cur.tireCompound !== prev.tireCompound) out.push('tireCompound')
  const cp = coldPsiRear(cur)
  const pp = coldPsiRear(prev)
  if (cp != null && pp != null && Math.abs(cp - pp) >= 0.25) out.push('coldPsi')
  return out
}

export function categoryOfField(f: string): SetupCategory {
  if (f === 'rearTeeth' || f === 'frontTeeth') return 'gearing'
  if (f === 'tireCompound' || f === 'coldPsi') return 'tires'
  return 'chassis'
}

interface RefPoint {
  setup: SessionSetup
  rpmPerKmh?: number
  bestMs?: number
  dateLabel: string
  dateSpoken: string
  airC?: number
}

function refFrom(prev: StoredSession | null, baseline?: DriverBaseline): RefPoint | null {
  // A baseline recorded after the previous library session is the more recent reference.
  const prevAt = prev ? sessionStartUtc(prev) : undefined
  if (prev && baseline?.atUtc && prevAt && baseline.atUtc > prevAt) prev = null
  if (prev) {
    const pl = sessionLocal(prev)
    return {
      setup: setupOf(prev),
      rpmPerKmh: rpmAtPeakSpeed(prev.laps).rpmPerKmh,
      bestMs: prev.laps[prev.bestLapIndex]?.timeMs,
      dateLabel: pl ? `${pl.monthShort} ${pl.day}` : '',
      dateSpoken: pl ? `${pl.monthLong} ${ordinalWords(pl.day)}` : 'last time',
      airC: prev.weather?.airC,
    }
  }
  if (baseline) {
    return {
      setup: { rearTeeth: baseline.rearTeeth },
      rpmPerKmh: baseline.rpmPerKmh,
      bestMs: baseline.bestMs,
      dateLabel: baseline.dateLabel,
      dateSpoken: baseline.dateSpoken,
      airC: baseline.airC,
    }
  }
  return null
}

/**
 * prev = this driver's previous session at this track + class; baseline = the driver's stored reference
 * for this track + class when there is no previous session in the library.
 */
export function buildSetupVerdict(s: StoredSession, prev: StoredSession | null, baseline?: DriverBaseline): SetupVerdict {
  const cls = getClassConfig(s.classId)
  const setup = setupOf(s)
  // Library previous session only for "Last change" / "vs Sep 26" — baselines never invent a prior outing.
  const prevRef = prev ? refFrom(prev, undefined) : null
  const gearRef = refFrom(prev, baseline) // RPM / gear evidence may still use baseline
  const prevSetup = prevRef?.setup
  const gpsOnly = s.sourceKind === 'xrk' || s.sourceKind === 'xrz'
  const health = buildHealthDiagnosticFromSession(s)
  const peak = rpmAtPeakSpeed(s.laps)
  const best = s.laps[s.bestLapIndex]
  const blanks: string[] = []
  if (!s.classId || s.classId === 'other') blanks.push(`Class unconfirmed — no limiter band`)
  if (setup.rearTeeth == null) blanks.push('Rear sprocket unknown — gear directional only')
  if (setup.frontTeeth == null) blanks.push('Front sprocket unknown — no tooth count')
  const cold = coldPsiRear(setup)
  if (cold == null) blanks.push('Cold PSI unknown — no start-pressure number')
  if (!setup.hotPsi || avg(Object.values(setup.hotPsi)) == null) blanks.push('Hot PSI not logged')
  if (!s.weather) blanks.push('Weather unavailable — no temp-based PSI nudge')

  // Prior change verdict — only when a real previous library session exists AND something changed.
  let priorChange: SetupVerdict['priorChange']
  const changed = changedFields(setup, prevSetup)
  const declared = setup.intentionalChange
  if (prev && prevSetup && (changed.length || (declared && declared !== 'none'))) {
    const cat: SetupCategory = declared && declared !== 'none' ? declared : categoryOfField(changed[0])
    if (cat === 'gearing' && setup.rearTeeth != null && prevSetup.rearTeeth != null && setup.rearTeeth !== prevSetup.rearTeeth) {
      const expected = setup.rearTeeth / prevSetup.rearTeeth - 1
      let applied: boolean | null = null
      let evidence: string | undefined
      if (peak.rpmPerKmh && gearRef?.rpmPerKmh) {
        const measured = peak.rpmPerKmh / gearRef.rpmPerKmh - 1
        applied = Math.abs(measured - expected) <= 0.01 && Math.sign(measured) === Math.sign(expected)
        evidence = `${measured >= 0 ? '+' : '−'}${Math.abs(measured * 100).toFixed(1)}% revs per km/h`
      }
      const shorter = setup.rearTeeth > prevSetup.rearTeeth
      priorChange = {
        category: 'gearing',
        text: `rear ${prevSetup.rearTeeth}→${setup.rearTeeth}`,
        applied,
        evidence,
        spoken: `${numberWords(setup.rearTeeth)} tooth ${applied ? 'went on correctly' : applied === false ? "doesn't show in the data — recount the sprockets" : 'went on'}${
          applied ? ` — about ${numberWords(Math.round(Math.abs(expected) * 100))} percent ${shorter ? 'shorter' : 'taller'}` : ''
        }`,
      }
    } else {
      priorChange = { category: cat, text: `${CAT_LABEL[cat].toLowerCase()} changed`, applied: null }
    }
  }

  // Limiter / straight-line story
  let limiterLine: string | undefined
  let limiterSpoken: string | undefined
  let underLimiter: boolean | undefined
  if (cls.limiter != null && peak.rpmAtPeak != null) {
    underLimiter = peak.rpmAtPeak < (cls.nearLimiter ?? cls.limiter)
    limiterLine = `Peak ~${Math.round(peak.rpmAtPeak).toLocaleString('en-US')} RPM @ ${Math.round(peak.maxSpeed ?? 0)} km/h · ${
      underLimiter ? 'under' : 'at'
    } the ${cls.limiter} limiter`
    limiterSpoken = cls.limiterSpoken ? `${underLimiter ? "you're still under" : "you're on"} the ${cls.limiterSpoken} limiter` : undefined
  }

  // vs last: same ref as gearing (library prev, or newer baseline). Label baseline when no library prev.
  let vsLast: SetupVerdict['vsLast']
  if (gearRef?.bestMs && best) {
    const baselineOnly = !prev
    vsLast = {
      prevBestMs: gearRef.bestMs,
      deltaMs: best.timeMs - gearRef.bestMs,
      prevDate: baselineOnly ? `baseline · ${gearRef.dateLabel}` : gearRef.dateLabel,
      prevDateSpoken: baselineOnly ? 'your baseline' : gearRef.dateSpoken,
    }
  }

  // Weather vs last
  const airNow = s.weather?.airC
  const airPrev = gearRef?.airC
  const coolerBy = airNow != null && airPrev != null ? airPrev - airNow : undefined
  let weatherLine: string | undefined
  if (s.weather) {
    weatherLine = [
      airNow != null ? `${Math.round(airNow)}°C` : null,
      s.weather.conditions,
      s.weather.wet ? 'wet' : 'dry',
      coolerBy != null && Math.abs(coolerBy) >= 1 ? `${Math.abs(Math.round(coolerBy))}°C ${coolerBy > 0 ? 'cooler' : 'warmer'} than last time` : null,
    ]
      .filter(Boolean)
      .join(' · ')
  }

  // ---- one category ----
  let category: SetupCategory = 'none'
  let action = 'Hold everything — no setup change this outing.'
  let actionSpoken = 'no setup change. Hold everything.'
  let why = 'Nothing in the data points at the kart this outing.'
  let confidence: SetupVerdict['confidence'] = gpsOnly ? 'medium' : 'high'
  const clutchCard = health.cards.find((c) => c.id === 'clutch')
  const gear = health.gearAdvice
  const wet = !!s.weather?.wet || s.conditions === 'wet'
  const gripDown = !wet && vsLast != null && vsLast.deltaMs / vsLast.prevBestMs >= 0.02 && (!gear || gear.action === 'hold')
  const tireCardFix = health.cards.find((c) => c.id === 'tire_pressure')?.status === 'fix'

  if (clutchCard?.status === 'fix') {
    category = 'clutch'
    action = clutchCard.optimize
    actionSpoken = 'check the clutch first — see the setup card for the shop steps.'
    why = clutchCard.diagnosis
  } else if (gear && (gear.action === 'plus' || gear.action === 'minus')) {
    category = 'gearing'
    action = gear.summary
    actionSpoken =
      gear.suggestedRearTeeth != null
        ? `gearing. Go to a ${numberWords(gear.suggestedRearTeeth)} tooth rear.`
        : `gearing. ${gear.action === 'plus' ? 'More rear teeth, a shorter gear' : 'Fewer rear teeth, a taller gear'}.`
    why = gear.headline
  } else if (tireCardFix || gripDown || (coolerBy != null && coolerBy >= 5)) {
    category = 'tires'
    const warmer = coolerBy != null && coolerBy <= -5
    if (cold != null) {
      const lo = warmer ? cold - 0.5 : cold + 0.5
      const hi = warmer ? cold - 0.5 : cold + 1.0
      action = lo === hi ? `start ${fmtPsi(lo)} psi cold, log hot` : `start ${fmtPsi(lo)}–${fmtPsi(hi)} psi cold, log hot`
      actionSpoken = `tires. Start ${psiWords(lo)}${lo === hi ? '' : ` to ${psiWords(hi)}`} PSI cold${
        setup.rearTeeth != null ? `, keep ${numberWords(setup.rearTeeth)} on` : ''
      }, log hot PSI when you pit.`
    } else {
      action = 'log cold and hot PSI next round (cold PSI unknown — no start-pressure number)'
      actionSpoken = 'tires. Log cold and hot pressures next round.'
      confidence = 'low'
    }
    why = gripDown
      ? `Best ${formatLapTime(best?.timeMs)} is ${((vsLast!.deltaMs / vsLast!.prevBestMs) * 100).toFixed(1)}% off ${vsLast!.prevDate} with gearing confirmed — grip is the limiter${
          coolerBy != null && coolerBy > 0 ? ` on a ${Math.round(coolerBy)}°C cooler day` : ''
        }.`
      : coolerBy != null && coolerBy >= 5
        ? `${Math.round(coolerBy)}°C cooler than last time — tires need more pressure to come in.`
        : 'Tire grip fading in the data.'
  }
  const hold = (['gearing', 'clutch', 'tires', 'chassis'] as SetupCategory[]).filter((c) => c !== category)
  const keepGear = category !== 'gearing' && setup.rearTeeth != null ? `keep ${setup.rearTeeth}T` : null
  const holdLabel = hold.join(', ')
  const exitsConfounded = category === 'gearing' || category === 'clutch' || category === 'tires'

  // ---- tuner voice (~35 s) ----
  const local = sessionLocal(s)
  const track = getTrack(s.trackId)
  const dateSpoken = local
    ? `${local.monthLong} ${ordinalWords(local.day)}`
    : 'this session'
  const parts: string[] = [`Tuner brief, ${dateSpoken} at ${track.short}.`]
  if (gpsOnly) parts.push('GPS only.')
  if (priorChange?.spoken) parts.push(`${priorChange.spoken}${limiterSpoken && underLimiter ? `, and ${limiterSpoken}` : ''}.`)
  else if (limiterSpoken) parts.push(`${limiterSpoken.charAt(0).toUpperCase()}${limiterSpoken.slice(1)}.`)
  if (best) {
    let line = `Best was ${lapSpokenFull(best.timeMs)}`
    if (vsLast && Math.abs(vsLast.deltaMs) >= 300) {
      const secs = Math.abs(vsLast.deltaMs) / 1000
      const secWords = secs >= 1 ? `${numberWords(Math.round(secs))} second${Math.round(secs) === 1 ? '' : 's'}` : 'a few tenths'
      line += `, ${secWords} ${vsLast.deltaMs > 0 ? 'off' : 'up on'} ${vsLast.prevDateSpoken}'s ${lapSpokenFull(vsLast.prevBestMs)}`
      if (category === 'tires' && gripDown) line += ', mostly from lower grip'
    }
    parts.push(`${line}.`)
  }
  parts.push(category === 'none' ? 'Next round: no setup change.' : `Next round, one change: ${actionSpoken}`)
  parts.push(`Hold ${hold.filter((h) => h !== 'chassis').map((h) => (h === 'gearing' ? 'gear' : h)).join(' and ')}.`)
  const voiceScript = parts.join(' ')

  return {
    category,
    categoryLabel: CAT_LABEL[category],
    action: keepGear && category === 'tires' && !action.includes('keep') ? `${action}; ${keepGear}` : action,
    actionSpoken,
    hold,
    holdLabel,
    why,
    priorChange,
    limiterLine,
    limiterSpoken,
    underLimiter,
    gpsOnly,
    classLabel: cls.label,
    classLine: cls.limiter != null ? `${cls.label} · ${cls.limiter}` : `${cls.label} · limiter unknown`,
    exitsConfounded,
    vsLast,
    weatherLine,
    blanks,
    preCheck: 'Quick check only (not a setup change): chain slack and the rear spins free with no brake drag.',
    confidence,
    voiceScript,
  }
}

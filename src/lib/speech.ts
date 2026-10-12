/** Numbers written for the ear (voice scripts). */

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

export function numberWords(n: number): string {
  n = Math.round(n)
  if (n < 0) return `minus ${numberWords(-n)}`
  if (n < 20) return ONES[n]
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '')
  if (n < 1000) return `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ` ${numberWords(n % 100)}` : ''}`
  if (n < 10000 && n % 100 !== 0 && n % 1000 >= 100) {
    // 6150 → "sixty-one-fifty" (how racers say RPM)
    return `${numberWords(Math.floor(n / 100))}-${numberWords(n % 100)}`
  }
  if (n < 1000000) return `${numberWords(Math.floor(n / 1000))} thousand${n % 1000 ? ` ${numberWords(n % 1000)}` : ''}`
  return String(n)
}

/** Two-digit seconds for the ear: 8 → "oh-eight", 10 → "ten". */
function secWords(s: number): string {
  return s < 10 ? `oh-${ONES[s]}` : numberWords(s)
}

/** 70.909 s → "one-ten-nine" (minutes, seconds, tenths) — driver voice. */
export function lapSpokenShort(ms: number): string {
  const tenthsTotal = Math.floor(ms / 100)
  const tenths = tenthsTotal % 10
  const totalSec = Math.floor(tenthsTotal / 10)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return m > 0 ? `${ONES[m] ?? numberWords(m)}-${secWords(s)}-${ONES[tenths]}` : `${numberWords(s)} point ${ONES[tenths]}`
}

/** 70.909 s → "one ten nine oh nine" (full thousandths) — tuner voice. */
export function lapSpokenFull(ms: number): string {
  const total = Math.round(ms)
  const m = Math.floor(total / 60000)
  const s = Math.floor((total % 60000) / 1000)
  const milli = String(total % 1000).padStart(3, '0')
  const digits = milli.split('').map((d) => (d === '0' ? 'oh' : ONES[+d])).join(' ')
  return `${m > 0 ? `${ONES[m]} ` : ''}${s < 10 ? `oh ${ONES[s]}` : numberWords(s).replace('-', ' ')} ${digits}`.trim()
}

/** 1 → "first", 4 → "fourth" … (dates for the ear). */
export function ordinalWords(n: number): string {
  const special: Record<number, string> = { 1: 'first', 2: 'second', 3: 'third', 5: 'fifth', 8: 'eighth', 9: 'ninth', 12: 'twelfth', 20: 'twentieth', 30: 'thirtieth' }
  if (special[n]) return special[n]
  if (n > 20 && n % 10 !== 0) return `${TENS[Math.floor(n / 10)]}-${ordinalWords(n % 10)}`
  return `${numberWords(n)}th`
}

/** PSI for the ear: 11.5 → "eleven and a half". */
export function psiWords(p: number): string {
  const whole = Math.floor(p)
  return Math.abs(p - whole - 0.5) < 0.01 ? `${numberWords(whole)} and a half` : numberWords(Math.round(p))
}

/** 70909 → '1:10.9' (one decimal, for SMS). */
export function lapShort(ms: number): string {
  const tenths = Math.floor(ms / 100)
  const m = Math.floor(tenths / 600)
  const s = Math.floor((tenths % 600) / 10)
  return `${m}:${String(s).padStart(2, '0')}.${tenths % 10}`
}

/** Seconds of speech at a typical pace (~150 wpm). */
export function speechSeconds(text: string, wpm = 150): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.round((words / wpm) * 60)
}

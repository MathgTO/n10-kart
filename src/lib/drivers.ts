/**
 * Driver profiles + logger binding. Stored locally (same localStorage as sessions).
 * A bound logger serial auto-assigns its driver with no prompt; an unknown serial asks once;
 * a missing serial (CSV) falls back to the last-used driver at that track (if that driver still exists).
 * Shared loggers are not a use case: one serial → one driver.
 * Binding is permanent until the user edits Drivers or uses Wrong driver rebind — import never overwrites.
 */
import type { DriverProfile, StoredSession } from './types'

const DRIVERS_KEY = 'n10-kart-drivers-v1'
/** Opt-in demo seed: localStorage n10-dev-seed-gabriel=1 or ?devSeed=gabriel */
export const DEV_SEED_GABRIEL_KEY = 'n10-dev-seed-gabriel'

export const GABRIEL_ID = 'drv-gabriel'
/** Anonymous id for demo sessions so vs-last works without claiming Gabriel. */
export const DEMO_DRIVER_ID = 'drv-demo'

export function seedDrivers(): DriverProfile[] {
  return [
    {
      id: GABRIEL_ID,
      displayName: 'Gabriel',
      age: 11,
      classDefault: 'junior_light',
      kidCard: true,
      boundLoggers: [{ serial: 35023763, model: 'MyChron 6' }],
      baselines: [
        {
          trackId: 'mosport',
          layoutId: 'gp',
          classId: 'junior_light',
          bestMs: 67967,
          rearTeeth: 67,
          airC: 20,
          rpmPerKmh: 66.3,
          dateLabel: 'Sep 26',
          dateSpoken: 'September',
          atUtc: '2026-09-26T21:31:00Z',
          source: 'Kart Tuning Expert notes: September baseline 1:07.967 at 67T, about 20°C (Sep 26 17:31 MyChron file, not bundled)',
        },
      ],
    },
  ]
}

function wantsDevSeedGabriel(): boolean {
  try {
    if (localStorage.getItem(DEV_SEED_GABRIEL_KEY) === '1') return true
    if (typeof location !== 'undefined') {
      const q = new URLSearchParams(location.search)
      if (q.get('devSeed') === 'gabriel') {
        // Persist flag so subsequent loads (and SW navigations without the query) keep the seed.
        localStorage.setItem(DEV_SEED_GABRIEL_KEY, '1')
        return true
      }
    }
  } catch {
    /* ignore */
  }
  return false
}

export function loadDrivers(): DriverProfile[] {
  try {
    const raw = localStorage.getItem(DRIVERS_KEY)
    if (raw != null) {
      const list = JSON.parse(raw) as DriverProfile[]
      // Preserve any non-empty list already on this device (e.g. Mathieu's Gabriel+serial binding).
      if (Array.isArray(list) && list.length) return list
      // Empty []: fall through — flag may seed for demos; otherwise stay empty.
    }
  } catch {
    /* fall through */
  }
  // First open / empty: default []. Gabriel Mosport seed only behind explicit Mathieu/dev flag.
  if (wantsDevSeedGabriel()) return seedDrivers()
  return []
}

export function saveDrivers(list: DriverProfile[]): boolean {
  try {
    localStorage.setItem(DRIVERS_KEY, JSON.stringify(list))
    return true
  } catch {
    return false
  }
}

/** Kid card default: on under 13 (or when age unknown and explicitly toggled). */
export function defaultKidCard(age?: number): boolean {
  return age != null && age < 13
}

export function driverForSerial(list: DriverProfile[], serial?: number): DriverProfile | undefined {
  if (serial == null) return undefined
  return list.find((d) => d.boundLoggers.some((l) => l.serial === serial))
}

/** Last driver used at this track (CSV / no serial fallback). Caller must verify id still exists in drivers. */
export function lastDriverAtTrack(sessions: StoredSession[], trackId: string): string | undefined {
  const s = [...sessions]
    .filter((x) => x.trackId === trackId && x.driverId && !x.isDemo)
    .sort((a, b) => (b.startUtc ?? b.createdAt).localeCompare(a.startUtc ?? a.createdAt))[0]
  return s?.driverId
}

/** Bind a serial to one driver (removes it from anyone else — no shared loggers). */
export function bindLogger(list: DriverProfile[], driverId: string, serial: number, model?: string): DriverProfile[] {
  return list.map((d) => {
    const others = d.boundLoggers.filter((l) => l.serial !== serial)
    if (d.id === driverId) return { ...d, boundLoggers: [...others, { serial, model }] }
    return { ...d, boundLoggers: others }
  })
}

export function unbindLogger(list: DriverProfile[], serial: number): DriverProfile[] {
  return list.map((d) => ({ ...d, boundLoggers: d.boundLoggers.filter((l) => l.serial !== serial) }))
}

export function newDriverId(name: string): string {
  return `drv-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20)}-${Date.now().toString(36)}`
}

export function serialTail(serial?: number): string {
  return serial != null ? `…${String(serial).slice(-4)}` : ''
}

export function initial(name: string): string {
  return (name.trim()[0] ?? '?').toUpperCase()
}

import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { DriverPrompt } from '@/components/DriverPrompt'
import { Sheet } from '@/components/Sheet'
import { allTracks, getTrack } from '@/data/tracks'
import { createNamedLayout, layoutDisplayName, listLayouts, renameLayout, resolveFromDetection } from '@/lib/layoutRegistry'
import { useSessions } from '@/hooks/SessionsContext'
import { CLASS_OPTIONS, getClassConfig, TIRE_CHOICES, TIRE_MANDATED } from '@/lib/classConfig'
import { initial, serialTail } from '@/lib/drivers'
import { distanceM } from '@/lib/geo'
import { createTrackFromDetection, prefillSetup, previousFor } from '@/lib/pipeline'
import { canonicalLabel, sessionLocal } from '@/lib/sessionLabel'
import { deviceZone, fromLocalInput, isValidZone, loggerDateLabel, toLocalInput } from '@/lib/sessionTime'
import { pickLayout } from '@/lib/trackDetect'
import { fetchWeather } from '@/lib/weather'
import type { IntentionalChange, SessionSetup, StoredSession, WeatherSnapshot } from '@/lib/types'

const ZONES = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix', 'America/Los_Angeles', 'America/Halifax', 'Europe/London', 'Europe/Paris', 'Europe/Rome', 'Australia/Sydney']

function Stepper({ label, value, onChange, step = 1, min, max, unit, badge }: { label: string; value?: number; onChange: (v: number) => void; step?: number; min: number; max: number; unit?: string; badge?: string }) {
  const v = value ?? min
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-sm font-semibold text-n10-soft">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" aria-label={`${label} down`} className="h-12 w-12 rounded-xl border border-n10-border bg-n10-card text-2xl font-bold text-white" onClick={() => onChange(Math.max(min, +(v - step).toFixed(1)))}>
          −
        </button>
        <span className="min-w-[4.5rem] text-center text-3xl font-black text-white" aria-live="polite">
          {value == null ? '—' : step < 1 ? value.toFixed(1) : value}
        </span>
        <button type="button" aria-label={`${label} up`} className="h-12 w-12 rounded-xl border border-n10-border bg-n10-card text-2xl font-bold text-white" onClick={() => onChange(Math.min(max, value == null ? v : +(v + step).toFixed(1)))}>
          +
        </button>
      </div>
      {unit && <span className="text-sm text-n10-mute">{unit}</span>}
      {badge && <span className="rounded-full bg-n10-teal/15 px-2.5 py-0.5 text-sm font-semibold text-n10-teal">{badge}</span>}
    </div>
  )
}

function Card({ title, children, extra }: { title: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-n10-border bg-n10-panel p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-n10-teal">{title}</h2>
        {extra}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={`min-h-[48px] rounded-xl border px-4 font-semibold ${on ? 'border-n10-lime bg-n10-lime text-black' : 'border-n10-border bg-n10-card text-white'}`}>
      {children}
    </button>
  )
}


function LayoutRenameRow({ trackId, layoutId, onPicked }: { trackId: string; layoutId?: string; onPicked: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  if (!open) {
    return (
      <button type="button" className="mt-2 text-sm font-semibold text-n10-lime" onClick={() => setOpen(true)}>
        {layoutId ? 'Rename layout…' : 'Name this layout…'}
      </button>
    )
  }
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <input
        className="min-h-[44px] flex-1 rounded-xl border border-n10-border bg-n10-card px-3 text-white font-semibold"
        placeholder="Facility / layout name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        type="button"
        className="btn-primary min-h-[44px] px-3 text-sm"
        onClick={() => {
          const trimmed = name.trim()
          if (!trimmed) return
          const rec = layoutId ? renameLayout(trackId, layoutId, trimmed) : createNamedLayout(trackId, trimmed)
          if (rec) onPicked(rec.id)
          setOpen(false)
          setName('')
        }}
      >
        Save
      </button>
      <button type="button" className="btn-secondary min-h-[44px] px-3 text-sm" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </div>
  )
}

function TrackSheet({ open, onClose, s }: { open: boolean; onClose: () => void; s: StoredSession }) {
  const { updateSessionMeta } = useSessions()
  const [newName, setNewName] = useState('')
  const c = s.detection?.centroid
  const tracks = useMemo(() => {
    const list = allTracks().filter((t) => t.id !== 'other')
    if (!c) return list
    return [...list].sort((a, b) => (a.lat != null ? distanceM(c, { lat: a.lat, lon: a.lon! }) : 1e12) - (b.lat != null ? distanceM(c, { lat: b.lat, lon: b.lon! }) : 1e12))
  }, [c])
  const choose = (trackId: string, layoutId?: string) => {
    const t = getTrack(trackId)
    let nextLayout = layoutId
    if (!nextLayout) {
      const geo = pickLayout(t, s.detection?.lapLengthM, s.detection?.direction)
      const resolved = resolveFromDetection(trackId, {
        layoutId: geo,
        lapLengthM: s.detection?.lapLengthM,
        direction: s.detection?.direction,
        confidence: 'high',
      })
      nextLayout = resolved?.id
    }
    updateSessionMeta(s.id, {
      trackId,
      layoutId: nextLayout,
      detectConfidence: 'manual',
      ...(s.tzSource !== 'manual' && t.tz ? { timeZone: t.tz, tzSource: 'track' as const } : {}),
    })
    onClose()
  }
  const cur = getTrack(s.trackId)
  return (
    <Sheet open={open} onClose={onClose} title="Track and layout">
      <div className="mb-4">
        <p className="label-lg">Layout at {cur.short ?? cur.name}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {listLayouts(cur.id).map((l) => (
            <Chip key={l.id} on={s.layoutId === l.id} onClick={() => choose(cur.id, l.id)}>
              {l.displayName}
            </Chip>
          ))}
          {!s.layoutId && (
            <span className="min-h-[48px] inline-flex items-center rounded-xl border border-amber-300/50 px-4 font-semibold text-amber-100">
              Layout?
            </span>
          )}
        </div>
        <LayoutRenameRow trackId={cur.id} layoutId={s.layoutId} onPicked={(id) => choose(cur.id, id)} />
      </div>
      <p className="label-lg">{c ? 'Nearest first' : 'Tracks'}</p>
      <ul className="mt-2 space-y-2">
        {tracks.slice(0, 12).map((t) => (
          <li key={t.id}>
            <button type="button" className={`flex min-h-[52px] w-full items-center justify-between gap-2 rounded-xl border px-4 text-left ${t.id === s.trackId ? 'border-n10-lime bg-n10-lime/10' : 'border-n10-border bg-n10-card'}`} onClick={() => choose(t.id)}>
              <span className="font-semibold text-white">{t.name}</span>
              <span className="text-sm text-n10-mute">{c && t.lat != null ? `${(distanceM(c, { lat: t.lat, lon: t.lon! }) / 1000).toFixed(t.lat != null && distanceM(c, { lat: t.lat, lon: t.lon! }) < 10000 ? 1 : 0)} km` : t.region}</span>
            </button>
          </li>
        ))}
      </ul>
      {c && (
        <div className="mt-4 rounded-xl border border-n10-border bg-n10-card p-3">
          <p className="font-semibold text-white">New track from this file’s GPS</p>
          <p className="text-sm text-n10-mute">Saved on this device. Centre {c.lat.toFixed(4)}, {c.lon.toFixed(4)}.</p>
          <div className="mt-2 flex gap-2">
            <input className="min-h-[48px] flex-1 rounded-lg border border-n10-border bg-black px-3 text-base text-white" placeholder="Track name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <button
              type="button"
              className="btn-secondary min-h-[48px]"
              disabled={!newName.trim()}
              onClick={async () => {
                const t = await createTrackFromDetection(newName.trim(), s)
                if (t) updateSessionMeta(s.id, { trackId: t.id, layoutId: 'main', detectConfidence: 'manual', timeZone: t.tz, tzSource: 'tz-lookup' })
                onClose()
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </Sheet>
  )
}

export function SetupStepPage() {
  const { id } = useParams()
  const loc = useLocation()
  const nav = useNavigate()
  const { getSession, sessions, drivers, saveSetup, updateSessionMeta } = useSessions()
  const s = id ? getSession(id) : undefined
  const prev = useMemo(() => (s ? previousFor(s, sessions) : null), [s, sessions])
  const [setup, setSetup] = useState<SessionSetup>({})
  const [classId, setClassId] = useState('junior_light')
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null)
  const [wxBusy, setWxBusy] = useState(false)
  const [wxErr, setWxErr] = useState<string | null>(null)
  const [frontOpen, setFrontOpen] = useState(false)
  const [trackOpen, setTrackOpen] = useState(false)
  const [driverPrompt, setDriverPrompt] = useState<null | 'unknown' | 'wrong'>(null)
  const [timeEdit, setTimeEdit] = useState(false)
  const [changeSomething, setChangeSomething] = useState(false)

  useEffect(() => {
    if (!s) return
    setSetup(s.setup ?? prefillSetup(s, sessions, drivers).prefill)
    setClassId(s.classId ?? 'junior_light')
    setWeather(s.weather ?? null)
    setFrontOpen(s.setup?.frontTeeth != null)
    if (!s.driverId && s.logger?.serial != null) setDriverPrompt('unknown')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s?.id])

  if (!s) {
    return (
      <div className="panel py-12 text-center">
        <p className="text-lg">Session not found.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">
          Sessions
        </Link>
      </div>
    )
  }
  const firstTime = (loc.state as { fresh?: boolean } | null)?.fresh
  const driver = drivers.find((d) => d.id === s.driverId)
  const track = getTrack(s.trackId)
  const layoutLabel = layoutDisplayName(s.trackId, s.layoutId)
  const cls = getClassConfig(classId)
  const prevSetup = prev?.setup
  const label = canonicalLabel(s, sessions)
  const local = sessionLocal(s)
  const set = (patch: Partial<SessionSetup>) => setSetup((x) => ({ ...x, ...patch }))
  const psi = setup.coldPsi ?? {}
  const setPsi = (k: 'fl' | 'fr' | 'rl' | 'rr', v: number) => set({ coldPsi: { ...psi, [k]: v } })
  const hot = setup.hotPsi ?? {}
  const loggerSaid = loggerDateLabel(s.logger?.rawDate, s.logger?.hwReg)
  const conf = s.detectConfidence ?? 'low'

  const save = (sameAsLast?: boolean) => {
    const st = sameAsLast && prevSetup ? { ...prevSetup, hotPsi: undefined, intentionalChange: 'none' as IntentionalChange, notes: undefined } : setup
    saveSetup(s.id, st, { classId, weather })
    nav(`/session/${s.id}`, { replace: true })
  }

  const sameAsLastGate = !!(firstTime && prevSetup && !changeSomething)

  if (sameAsLastGate) {
    const teeth = prevSetup.rearTeeth
    const psi = prevSetup.coldPsi
    const psiNote =
      psi && (psi.rl != null || psi.rr != null)
        ? ` · cold ~${psi.rl ?? psi.rr}/${psi.rr ?? psi.rl} psi`
        : ''
    return (
      <div className="mx-auto max-w-3xl space-y-4 pb-32">
        <header>
          <p className="text-sm text-n10-mute">After import · Round setup</p>
          <h1 className="text-2xl font-black">Same kart as last round?</h1>
          <p className="mt-2 text-n10-soft">
            {label}
            {teeth != null ? ` · ${teeth}T` : ''}
            {psiNote}
          </p>
        </header>
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-n10-border bg-black/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <div className="mx-auto flex max-w-3xl flex-col gap-2">
            <button type="button" className="btn-primary min-h-[52px] w-full text-lg" onClick={() => save(true)}>
              Same as last round
            </button>
            <button type="button" className="btn-secondary min-h-[48px] w-full" onClick={() => setChangeSomething(true)}>
              Change something
            </button>
          </div>
        </div>
        <TrackSheet open={trackOpen} onClose={() => setTrackOpen(false)} s={s} />
        {driverPrompt && <DriverPrompt open onClose={() => setDriverPrompt(null)} session={s} reason={driverPrompt} />}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-48">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-n10-mute">{firstTime ? 'After import · Round setup' : 'Edit setup'}</p>
          <h1 className="text-2xl font-black">What was on the kart?</h1>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-n10-border bg-n10-card py-2 pl-2 pr-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-n10-lime font-bold text-black">{driver ? initial(driver.displayName) : '?'}</span>
          <span>
            <span className="block font-semibold text-white">
              {driver?.displayName ?? 'No driver'}
              {s.logger?.serial != null ? ` · ${s.logger.model ?? 'MyChron'} · ${serialTail(s.logger.serial)}` : ''}
            </span>
            <button type="button" className="min-h-[28px] text-sm text-n10-mute underline underline-offset-2" onClick={() => setDriverPrompt(driver ? 'wrong' : 'unknown')}>
              {driver ? 'Wrong driver?' : 'Choose driver'}
            </button>
          </span>
        </div>
      </header>

      <section className="rounded-2xl border border-n10-border bg-n10-panel p-4">
        <p className="text-lg font-bold text-white">{label}</p>
        <div className={`mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${conf === 'high' ? 'border-n10-teal/50' : 'border-amber-300/50'}`}>
          <div>
            <p className="font-semibold text-white">
              {track.name}
              {layoutLabel ? ` · ${layoutLabel}` : ''}
            </p>
            <p className="text-sm text-n10-soft">
              {conf === 'manual'
                ? 'Chosen by you'
                : conf === 'high'
                  ? 'Detected from GPS · high confidence'
                  : conf === 'medium'
                    ? 'Best guess from GPS · please confirm'
                    : conf === 'none'
                      ? 'Unknown track — pick or save a new one'
                      : s.detection?.trackId
                        ? 'Matched from the file’s track name only — please confirm'
                        : 'Not detected — please pick the track'}
              {s.detection?.lapLengthM ? ` · ~${(s.detection.lapLengthM / 1000).toFixed(2)} km ${s.detection.direction?.toUpperCase() ?? ''}` : ''}
            </p>
          </div>
          <button type="button" className="btn-secondary min-h-[48px] text-n10-teal" onClick={() => setTrackOpen(true)}>
            Change
          </button>
        </div>
        {s.dateSource === 'gps' && s.dayOffset && !s.dateFixUndone ? (
          <p className="mt-3 text-sm text-n10-soft">
            Date fixed from GPS{loggerSaid ? ` (logger said ${loggerSaid})` : ''} ·{' '}
            <button
              type="button"
              className="min-h-[32px] font-semibold text-n10-lime underline underline-offset-2"
              onClick={() => updateSessionMeta(s.id, { startUtc: new Date(Date.parse(s.startUtc!) + (s.dayOffset ?? 0) * 86400000).toISOString(), dateFixUndone: true })}
            >
              Undo
            </button>
          </p>
        ) : s.dateFixUndone ? (
          <p className="mt-3 text-sm text-n10-soft">
            Using the logger date ·{' '}
            <button
              type="button"
              className="min-h-[32px] font-semibold text-n10-lime underline underline-offset-2"
              onClick={() => updateSessionMeta(s.id, { startUtc: new Date(Date.parse(s.startUtc!) - (s.dayOffset ?? 0) * 86400000).toISOString(), dateFixUndone: false })}
            >
              Use GPS date
            </button>
          </p>
        ) : s.dateSource !== 'gps' ? (
          <p className="mt-3 text-sm text-amber-100">Time from the logger clock (no GPS time) — unverified.</p>
        ) : null}
        {s.hourMismatch ? <p className="mt-1 text-sm text-n10-mute">Logger clock is {Math.abs(s.hourMismatch)} h off — time shown from GPS.</p> : null}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-n10-mute">
          <span>
            {local ? `${local.weekdayShort} ${local.monthShort} ${local.day} · ${local.hhmm} ${local.zone}` : 'No time'} · zone {s.timeZone ?? deviceZone()} ({s.tzSource ?? 'device'})
          </span>
          <button type="button" className="min-h-[32px] font-semibold text-n10-soft underline underline-offset-2" onClick={() => setTimeEdit((v) => !v)}>
            {timeEdit ? 'Done' : 'Edit time / zone'}
          </button>
        </div>
        {timeEdit && (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className="text-sm font-semibold text-n10-soft">
              Local start ({s.timeZone ?? deviceZone()})
              <input
                type="datetime-local"
                className="mt-1 block min-h-[48px] w-full rounded-lg border border-n10-border bg-black px-3 text-base text-white"
                value={s.startUtc ? toLocalInput(s.startUtc, s.timeZone ?? deviceZone()) : ''}
                onChange={(e) => {
                  const iso = fromLocalInput(e.target.value, s.timeZone ?? deviceZone())
                  if (iso) updateSessionMeta(s.id, { startUtc: iso, dateSource: 'manual' })
                }}
              />
            </label>
            <label className="text-sm font-semibold text-n10-soft">
              Time zone
              <select
                className="mt-1 block min-h-[48px] w-full rounded-lg border border-n10-border bg-black px-3 text-base text-white"
                value={s.timeZone ?? deviceZone()}
                onChange={(e) => isValidZone(e.target.value) && updateSessionMeta(s.id, { timeZone: e.target.value, tzSource: 'manual' })}
              >
                {[...new Set([s.timeZone ?? deviceZone(), deviceZone(), ...ZONES])].map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </section>

      <Card
        title="Weather (optional)"
        extra={weather && <button type="button" className="btn-secondary min-h-[44px]" onClick={() => setWeather(null)}>Clear</button>}
      >
        {weather ? (
          <p className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-n10-border bg-n10-card px-3 py-2">
            <span className="font-bold text-white">{weather.airC != null ? `${weather.airC}°C` : '—'}</span>
            <span className="text-n10-soft">
              · {weather.conditions ?? 'conditions —'} · {weather.wet ? 'wet' : 'dry'} · {weather.source === 'open-meteo' ? 'Open-Meteo' : 'entered'}
            </span>
          </p>
        ) : (
          <p className="text-sm text-n10-soft">Helps the tuner compare grip between days. Nothing is fetched unless you tap.</p>
        )}
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <button
            type="button"
            className="btn-secondary min-h-[48px]"
            disabled={wxBusy || track.lat == null || !s.startUtc}
            onClick={async () => {
              setWxBusy(true)
              setWxErr(null)
              const w = await fetchWeather(track.lat!, track.lon!, s.startUtc!)
              setWxBusy(false)
              if (w) setWeather(w)
              else setWxErr('Couldn’t get weather (offline?) — enter it below.')
            }}
          >
            {wxBusy ? 'Fetching…' : 'Fetch weather for this session'}
          </button>
          <label className="text-sm font-semibold text-n10-soft">
            Air °C
            <input
              inputMode="decimal"
              className="mt-1 block min-h-[48px] w-24 rounded-lg border border-n10-border bg-black px-3 text-base text-white"
              value={weather?.airC ?? ''}
              onChange={(e) => {
                const n = Number(e.target.value)
                setWeather({ ...(weather ?? { source: 'manual' }), airC: e.target.value === '' || !Number.isFinite(n) ? undefined : n, source: 'manual' })
              }}
            />
          </label>
          <Chip on={!!weather?.wet} onClick={() => setWeather({ ...(weather ?? { source: 'manual' }), wet: !weather?.wet, source: weather?.source ?? 'manual' })}>
            Wet track
          </Chip>
        </div>
        {wxErr && <p className="mt-2 text-sm text-amber-100">{wxErr}</p>}
        <p className="mt-2 text-sm text-n10-mute">Fetch sends only the track location and session hour to Open-Meteo.</p>
      </Card>

      <section>
        <p className="mb-2 font-semibold text-n10-soft">Class</p>
        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-n10-border bg-n10-panel p-1 sm:grid-cols-4">
          {CLASS_OPTIONS.map((c) => (
            <button key={c} type="button" aria-pressed={classId === c} onClick={() => setClassId(c)} className={`min-h-[48px] rounded-xl font-semibold ${classId === c ? 'bg-n10-lime text-black' : 'text-n10-soft'}`}>
              {getClassConfig(c).label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-n10-soft">{cls.detail}</p>
      </section>

      <Card title="Gearing">
        <div className={`rounded-xl border p-3 ${prevSetup?.rearTeeth != null && setup.rearTeeth !== prevSetup.rearTeeth ? 'border-n10-teal bg-n10-teal/5' : 'border-n10-border'}`}>
          <Stepper
            label="Rear sprocket"
            unit="teeth"
            min={50}
            max={90}
            value={setup.rearTeeth}
            onChange={(v) => set({ rearTeeth: v })}
            badge={prevSetup?.rearTeeth != null ? (setup.rearTeeth !== prevSetup.rearTeeth ? `was ${prevSetup.rearTeeth} · changed` : `same as last (${prevSetup.rearTeeth})`) : undefined}
          />
          {setup.rearTeeth == null && (
            <button type="button" className="btn-secondary mx-auto mt-2 flex min-h-[48px]" onClick={() => set({ rearTeeth: 67 })}>
              Enter rear teeth
            </button>
          )}
        </div>
        <div className="mt-3 rounded-xl border border-dashed border-n10-border p-3">
          <p className="font-semibold text-white">Front sprocket</p>
          {frontOpen ? (
            <div className="mt-2">
              <Stepper label="Front sprocket" unit="teeth" min={12} max={24} value={setup.frontTeeth ?? 19} onChange={(v) => set({ frontTeeth: v })} />
              <button type="button" className="mx-auto mt-2 block min-h-[44px] text-sm text-n10-mute underline" onClick={() => { set({ frontTeeth: undefined }); setFrontOpen(false) }}>
                I don’t know the front
              </button>
            </div>
          ) : (
            <>
              <p className="mt-1 text-sm text-n10-soft">Front sprocket unknown — no tooth count</p>
              <button type="button" className="btn-secondary mt-2 min-h-[48px] w-full text-n10-teal" onClick={() => { set({ frontTeeth: setup.frontTeeth ?? 19 }); setFrontOpen(true) }}>
                Enter front teeth
              </button>
            </>
          )}
        </div>
      </Card>

      <Card title="Tires">
        {cls.tireSizeDry ? (
          <p className="text-sm text-n10-soft">Dry size {cls.tireSizeDry}</p>
        ) : null}
        <div className={`${cls.tireSizeDry ? 'mt-2' : ''} flex flex-wrap gap-2`}>
          {TIRE_CHOICES.map((t) => {
            const race = (TIRE_MANDATED as readonly string[]).includes(t)
            return (
              <Chip key={t} on={(setup.tireCompound ?? cls.defaultTire) === t} onClick={() => set({ tireCompound: t })}>
                {t}
                {race ? <span className="ml-1 text-xs font-bold opacity-60">· race</span> : null}
              </Chip>
            )
          })}
        </div>
        <p className="mt-4 font-semibold text-white">Cold PSI</p>
        <div className="mt-2 grid grid-cols-2 gap-4">
          {(['fl', 'fr', 'rl', 'rr'] as const).map((k) => (
            <Stepper key={k} label={k.toUpperCase()} min={6} max={20} step={0.5} value={psi[k]} onChange={(v) => setPsi(k, v)} />
          ))}
        </div>
        {psi.fl == null && psi.rl == null && <p className="mt-2 text-sm text-n10-mute">Unknown is fine — the tuner card will ask you to log cold and hot PSI.</p>}
        <details className="mt-4 rounded-xl border border-n10-border bg-n10-card p-3">
          <summary className="min-h-[32px] cursor-pointer font-semibold text-white">I’m in — add hot PSI</summary>
          <div className="mt-3 grid grid-cols-2 gap-4">
            {(['fl', 'fr', 'rl', 'rr'] as const).map((k) => (
              <Stepper key={k} label={`Hot ${k.toUpperCase()}`} min={6} max={24} step={0.5} value={hot[k]} onChange={(v) => set({ hotPsi: { ...hot, [k]: v } })} />
            ))}
          </div>
        </details>
      </Card>

      <Card title="Clutch">
        <label className="block text-sm font-semibold text-n10-soft">
          Engagement RPM (optional)
          <input
            inputMode="numeric"
            className="mt-1 block min-h-[48px] w-40 rounded-lg border border-n10-border bg-black px-3 text-base text-white"
            value={setup.clutchEngagementRpm ?? ''}
            placeholder="unchanged"
            onChange={(e) => {
              const n = Number(e.target.value)
              set({ clutchEngagementRpm: e.target.value === '' || !Number.isFinite(n) ? undefined : n })
            }}
          />
        </label>
      </Card>

      <Card title="What did you change on purpose?">
        <div className="flex flex-wrap gap-2">
          {(['none', 'gearing', 'clutch', 'tires', 'chassis'] as IntentionalChange[]).map((c) => (
            <Chip key={c} on={(setup.intentionalChange ?? 'none') === c} onClick={() => set({ intentionalChange: c })}>
              {c === 'none' ? 'Nothing' : c[0].toUpperCase() + c.slice(1)}
            </Chip>
          ))}
        </div>
      </Card>

      <details className="rounded-2xl border border-n10-border bg-n10-panel p-4">
        <summary className="min-h-[32px] cursor-pointer text-lg font-bold text-n10-teal">More setup</summary>
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Chip on={setup.chainOk === true} onClick={() => set({ chainOk: setup.chainOk ? undefined : true })}>
              Chain checked
            </Chip>
            <Chip on={setup.rearSpinsFree === true} onClick={() => set({ rearSpinsFree: setup.rearSpinsFree ? undefined : true })}>
              Rear spins free
            </Chip>
          </div>
          <label className="block text-sm font-semibold text-n10-soft">
            Kart + driver weight (kg)
            <input inputMode="decimal" className="mt-1 block min-h-[48px] w-32 rounded-lg border border-n10-border bg-black px-3 text-base text-white" value={setup.weightKg ?? ''} onChange={(e) => set({ weightKg: e.target.value ? Number(e.target.value) : undefined })} />
          </label>
          <label className="block text-sm font-semibold text-n10-soft">
            Notes
            <textarea className="mt-1 block min-h-[96px] w-full rounded-lg border border-n10-border bg-black p-3 text-base text-white" value={setup.notes ?? ''} onChange={(e) => set({ notes: e.target.value || undefined })} />
          </label>
        </div>
      </details>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-n10-border bg-black/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          <button type="button" className="btn-primary min-h-[52px] w-full text-lg" onClick={() => save()}>
            Save and see report
          </button>
          {prevSetup && (
            <button type="button" className="btn-secondary min-h-[48px] w-full" onClick={() => save(true)}>
              Same as last round
            </button>
          )}
        </div>
      </div>

      <TrackSheet open={trackOpen} onClose={() => setTrackOpen(false)} s={s} />
      {driverPrompt && <DriverPrompt open onClose={() => setDriverPrompt(null)} session={s} reason={driverPrompt} />}
    </div>
  )
}

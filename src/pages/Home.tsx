import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ImportModal } from '@/components/ImportModal'
import { useSessions } from '@/hooks/SessionsContext'
import { getClassConfig } from '@/lib/classConfig'
import { initial } from '@/lib/drivers'
import { formatLapTime } from '@/lib/format'
import { dayHeader, labelParts, sessionLocal } from '@/lib/sessionLabel'
import type { StoredSession } from '@/lib/types'

const IOS_TIP_KEY = 'n10-ios-homescreen-tip-dismissed'

function isIosDevice() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const iOS = /iPad|iPhone|iPod/.test(ua)
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return iOS || iPadOS
}

function IosHomeScreenTip() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      if (!isIosDevice()) return
      if (window.matchMedia('(display-mode: standalone)').matches) return
      if (localStorage.getItem(IOS_TIP_KEY) === '1') return
      setShow(true)
    } catch {
      /* ignore */
    }
  }, [])

  if (!show) return null

  return (
    <div className="rounded-2xl border border-n10-lime/30 bg-n10-lime/5 px-4 py-3 flex gap-3 items-start">
      <p className="flex-1 text-sm text-n10-soft leading-relaxed">
        <span className="font-semibold text-n10-lime">Add to Home Screen:</span> Share → Add to Home
        Screen — then open N10 like an app.
      </p>
      <button
        type="button"
        className="shrink-0 text-n10-mute text-lg leading-none px-1"
        aria-label="Dismiss"
        onClick={() => {
          try {
            localStorage.setItem(IOS_TIP_KEY, '1')
          } catch {
            /* ignore */
          }
          setShow(false)
        }}
      >
        ×
      </button>
    </div>
  )
}

export function Home() {
  const { sessions, drivers, loadDemos } = useSessions()
  const [importOpen, setImportOpen] = useState(false)
  const [driverFilter, setDriverFilter] = useState<string>('all')

  // Desktop: dragging a file anywhere onto the page opens Import so the drop lands in the modal.
  useEffect(() => {
    const onEnter = (e: DragEvent) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) setImportOpen(true)
    }
    window.addEventListener('dragenter', onEnter)
    return () => window.removeEventListener('dragenter', onEnter)
  }, [])

  const multiDriver = drivers.length >= 2
  const visible = sessions.filter((s) => driverFilter === 'all' || s.driverId === driverFilter)
  // Day groups (track-local day + track), newest first; demos last.
  const groups = useMemo(() => {
    const out: { key: string; header: string; items: StoredSession[]; demo: boolean; dateFixed: boolean }[] = []
    for (const s of visible) {
      const l = sessionLocal(s)
      const key = `${s.isDemo ? 'demo' : 'real'}|${l?.ymd ?? 'nodate'}|${s.trackId}`
      let g = out.find((x) => x.key === key)
      if (!g) {
        g = { key, header: (s.isDemo ? 'Demo · ' : '') + dayHeader(s), items: [], demo: !!s.isDemo, dateFixed: false }
        out.push(g)
      }
      g.items.push(s)
      if (s.dateSource === 'gps' && s.dayOffset && !s.dateFixUndone) g.dateFixed = true
    }
    return [...out.filter((g) => !g.demo), ...out.filter((g) => g.demo)]
  }, [visible])

  return (
    <div className="space-y-6 pb-8">
      <IosHomeScreenTip />

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-n10-mute">Library</p>
          <h1 className="text-2xl font-black">Sessions</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary min-h-[48px]" onClick={() => setImportOpen(true)}>
            Import
          </button>
          {!sessions.some((s) => !s.isDemo) && (
            <button type="button" className="btn-secondary min-h-[48px]" onClick={() => loadDemos()}>
              Demo sessions
            </button>
          )}
        </div>
      </section>

      {multiDriver && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Driver">
          <button type="button" className={`min-h-[48px] rounded-full px-5 font-semibold ${driverFilter === 'all' ? 'bg-n10-lime text-black' : 'border border-n10-border bg-n10-card text-white'}`} onClick={() => setDriverFilter('all')}>
            All
          </button>
          {drivers.map((d) => (
            <button key={d.id} type="button" className={`flex min-h-[48px] items-center gap-2 rounded-full px-4 font-semibold ${driverFilter === d.id ? 'bg-n10-lime text-black' : 'border border-n10-border bg-n10-card text-white'}`} onClick={() => setDriverFilter(d.id)}>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-n10-lime text-sm font-bold text-black">{initial(d.displayName)}</span>
              {d.displayName}
            </button>
          ))}
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="panel py-10 text-center">
          <p className="text-lg font-semibold">No sessions yet</p>
          <p className="mt-2 text-n10-soft">
            Tap <span className="font-semibold text-n10-lime">Import</span> to load a MyChron .xrk / .xrz or Race Studio CSV. Track, date and driver come from the file.
          </p>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.key}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wide text-n10-soft">{g.header}</h2>
              {g.dateFixed && <span className="rounded-full border border-amber-300/50 px-2 py-0.5 text-sm text-amber-200">date fixed from GPS</span>}
            </div>
            <ul className="space-y-2">
              {g.items.map((s) => (
                <SessionRow key={s.id} s={s} all={sessions} driverName={drivers.find((d) => d.id === s.driverId)?.displayName} />
              ))}
            </ul>
          </section>
        ))
      )}

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}

function SessionRow({ s, all, driverName }: { s: StoredSession; all: StoredSession[]; driverName?: string; onDelete?: () => void }) {
  const p = labelParts(s, all)
  const best = s.laps[s.bestLapIndex]
  const bestNum = best ? best.lapNumber ?? best.index + 1 : undefined
  const round = p.round ? `Round ${p.round}` : p.layout || p.track
  const target = s.setupConfirmed === false ? `/session/${s.id}/setup` : `/session/${s.id}`
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-n10-border bg-n10-card p-3 transition hover:border-n10-lime/40">
      <Link to={target} className="flex min-h-[56px] min-w-0 flex-1 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-n10-lime font-bold text-black" aria-label={driverName ?? 'No driver'}>
          {driverName ? initial(driverName) : '?'}
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-lg font-black text-white">{round}</span>
            <span className="text-xl font-black tabular-nums text-n10-lime">
              {best ? formatLapTime(best.timeMs) : '—'}
            </span>
            {s.isDemo && <span className="rounded-full border border-amber-300/60 px-2 text-sm font-bold uppercase text-amber-200">Demo</span>}
            {s.setupConfirmed === false && <span className="rounded-full border border-n10-teal/60 px-2 text-sm font-semibold text-n10-teal">setup needed</span>}
          </span>
          <span className="block text-sm text-n10-soft">
            {best ? `L${bestNum}` : 'Best —'}
            {p.time ? ` · ${p.time}` : ''}
            {s.setup?.rearTeeth ? ` · ${s.setup.rearTeeth}T` : ''}
            {` · ${getClassConfig(s.classId).label}`}
          </span>
        </span>
      </Link>
    </li>
  )
}

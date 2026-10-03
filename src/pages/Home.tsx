import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ImportModal } from '@/components/ImportModal'
import { useSessions } from '@/hooks/SessionsContext'
import { formatLapTime } from '@/lib/format'
import { seriesLabel } from '@/lib/labels'
import { FAQ_TITLE, HOME_FAQ, WORKS_WITH_BODY, WORKS_WITH_TITLE } from '@/data/homeFaq'

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
  const { sessions, loadDemos, prefs, deleteSession } = useSessions()
  const [importOpen, setImportOpen] = useState(false)

  return (
    <div className="space-y-8 pb-8">
      <IosHomeScreenTip />

      <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-bold uppercase tracking-wider text-n10-lime">The LO206 coach · Drivers + tuners</p>
                    <img
            src={`${import.meta.env.BASE_URL}n10-logo.jpg`}
            alt="N10 — The next tenth. This session."
            className="mt-2 w-full max-w-md rounded-xl border border-n10-border object-contain shadow-lg shadow-black/40"
            width={554}
            height={280}
            decoding="async"
          />
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Shave the Next Tenth</h1>
          <p className="mt-2 text-base text-n10-soft leading-relaxed">
            Import the session. Get the coaching note and the setup note. Walk back to the grid knowing exactly what to change. Built for phone, between runs — when Windows Race Studio can wait.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full sm:w-auto">
          {/* Single primary Import CTA on Home */}
          <button
            type="button"
            className="btn-primary text-lg px-6 py-4"
            onClick={() => setImportOpen(true)}
          >
            Import session
          </button>
          <button type="button" className="btn-secondary" onClick={() => loadDemos()}>
            Try sample sessions
          </button>
        </div>
      </section>

      <section aria-labelledby="works-with-heading" className="panel">
        <h2 id="works-with-heading" className="text-lg font-bold uppercase tracking-wide text-n10-lime">
          {WORKS_WITH_TITLE}
        </h2>
        <p className="mt-2 text-base text-n10-soft leading-relaxed">{WORKS_WITH_BODY}</p>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <InfoCard
          title="Reads your MyChron"
          body=".xrk / .xrz native · Race Studio CSV (Lap, Time, GPS Speed, RPM, Distance; sectors when present) · lap-only CSV OK · onboard video (mp4/mov) to play next to the data"
        />
        <InfoCard title="Coach call" body="Driver: where the time is, corner by corner, and which sectors it went in · Tuner: what the data says about exit RPM, gear, clutch and tire pressure" />
        <InfoCard title="Home circuit" body="Mosport Karting Centre · Bowmanville" />
      </div>

      <section>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold uppercase tracking-wide text-n10-soft">Sessions</h2>
          <span className="text-sm text-n10-mute">{sessions.length} in the library</span>
        </div>

        {sessions.length === 0 ? (
          <div className="mt-4 panel text-center py-10">
            <p className="text-lg font-semibold">No LO206 sessions yet</p>
            <p className="mt-2 text-n10-soft">
              Use <span className="text-n10-lime font-semibold">Import session</span> to load your
              MyChron file, or try sample sessions to see the coaching and setup read. Open a
              session to upload race video.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {sessions.map((s) => {
              const best = s.laps[s.bestLapIndex]
              return (
                <li
                  key={s.id}
                  className="rounded-2xl border border-n10-border bg-n10-card p-4 hover:border-n10-lime/40 transition"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <Link to={`/session/${s.id}`} className="min-w-0 flex-1 block">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold">{s.title}</h3>
                        <Tag>{seriesLabel(s.series)}</Tag>
                        {s.isDemo && <Tag>Demo</Tag>}
                      </div>
                      <p className="mt-1 text-sm text-n10-soft">
                        {s.classAssumption} · {s.trackName}
                      </p>
                      <p className="mt-1 text-sm text-n10-lime font-medium">
                        Coach call → {s.report.focus.cornerName}
                      </p>
                    </Link>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-right text-sm">
                        <p>
                          <span className="text-n10-mute">BEST </span>
                          <span className="text-n10-lime font-bold text-base">
                            {formatLapTime(best?.timeMs)}
                          </span>
                        </p>
                        <p className="text-n10-mute mt-1">LAPS {s.laps.length}</p>
                      </div>
                      <button
                        type="button"
                        className="text-xs font-semibold uppercase tracking-wide text-red-300/90 hover:text-red-200 border border-red-300/30 rounded-lg px-2.5 py-1"
                        aria-label={`Delete ${s.title}`}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (!window.confirm(`Delete session "${s.title}"?`)) return
                          deleteSession(s.id)
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-lg font-bold uppercase tracking-wide text-n10-soft">
          {FAQ_TITLE}
        </h2>
        <div className="mt-4 space-y-3">
          {HOME_FAQ.map((f) => (
            <div key={f.q} className="rounded-2xl border border-n10-border bg-n10-panel p-4">
              <h3 className="text-base font-bold text-white">{f.q}</h3>
              <p className="mt-2 text-base text-n10-soft leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-n10-border bg-n10-panel p-4">
      <p className="label-lg">{title}</p>
      <p className="mt-2 text-base text-n10-soft">{body}</p>
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-n10-border px-2 py-0.5 text-xs font-semibold uppercase text-n10-soft">
      {children}
    </span>
  )
}

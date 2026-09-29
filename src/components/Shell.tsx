import { NavLink, Outlet } from 'react-router-dom'
import { TrackPicker } from './TrackPicker'
import { useSessions } from '@/hooks/SessionsContext'
import { SAFETY_LINE, SUPPORT_EMAIL } from '@/lib/labels'

const BASE = import.meta.env.BASE_URL

const navCls = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-semibold uppercase tracking-wide px-2 py-1 rounded ${
    isActive ? 'text-n10-lime' : 'text-n10-soft hover:text-white'
  }`

export function Shell() {
  const { storageFull } = useSessions()
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-n10-border bg-black/90 backdrop-blur pt-[env(safe-area-inset-top)]">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-2 justify-end sm:justify-between">
          <nav className="flex flex-wrap items-center gap-1 sm:gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <NavLink to="/" end className={navCls}>
              Home
            </NavLink>
            <NavLink to="/drills" className={navCls}>
              Drills
            </NavLink>
            <NavLink to="/knowledge" className={navCls}>
              Knowledge
            </NavLink>
            <div className="ml-1 sm:ml-3">
              <TrackPicker />
            </div>
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">
        {storageFull && (
          <div role="alert" className="mb-4 rounded-xl border border-amber-300/50 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
            <span className="font-bold">Storage full, delete old sessions.</span> Your latest changes
            couldn&apos;t be saved on this device. Delete a few sessions you no longer need, then try again.
          </div>
        )}
        <Outlet />
      </main>
      <footer className="border-t border-n10-border">
        <div className="mx-auto max-w-6xl px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-1 text-xs text-n10-mute">
          <p className="text-sm font-semibold text-white">{SAFETY_LINE}</p>
          <p>N10 — the LO206 coach for drivers and tuners. Reads MyChron .xrk / .xrz and Race Studio CSV.</p>
          <p>
            N10 is independent and not affiliated with or endorsed by Briggs &amp; Stratton. LO206
            and Briggs &amp; Stratton are trademarks of their owners.
          </p>
          <p>
            <a href={`${BASE}privacy.html`} className="underline underline-offset-2 hover:text-white">
              Privacy
            </a>{' '}
            ·{' '}
            <a href={`${BASE}support.html`} className="underline underline-offset-2 hover:text-white">
              Support
            </a>{' '}
            · <a href={`mailto:${SUPPORT_EMAIL}`} className="underline underline-offset-2 hover:text-white">{SUPPORT_EMAIL}</a>
          </p>
        </div>
      </footer>
    </div>
  )
}

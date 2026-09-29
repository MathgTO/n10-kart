import { NavLink, Outlet } from 'react-router-dom'
import { TrackPicker } from './TrackPicker'

const navCls = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-semibold uppercase tracking-wide px-2 py-1 rounded ${
    isActive ? 'text-n10-lime' : 'text-n10-soft hover:text-white'
  }`

export function Shell() {
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
        <Outlet />
      </main>
      <footer className="border-t border-n10-border">
        <div className="mx-auto max-w-6xl px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-1 text-xs text-n10-mute">
          <p>N10 — the LO206 coach for drivers and tuners. Reads MyChron .xrk / .xrz and Race Studio CSV.</p>
          <p>
            N10 is independent and not affiliated with or endorsed by Briggs &amp; Stratton. LO206
            and Briggs &amp; Stratton are trademarks of their owners.
          </p>
        </div>
      </footer>
    </div>
  )
}

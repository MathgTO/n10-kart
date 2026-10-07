import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { DriverSheet } from './DriverSheet'
import { useSessions } from '@/hooks/SessionsContext'
import { SAFETY_LINE, SHELL_VERSION, SUPPORT_EMAIL } from '@/lib/labels'

const BASE = import.meta.env.BASE_URL

export function Shell() {
  const { storageFull, drivers } = useSessions()
  const [driversOpen, setDriversOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <div className="flex min-h-screen max-w-full flex-col overflow-x-clip">
      <header className="no-print sticky top-0 z-40 border-b border-n10-border bg-black/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2">
          <Link to="/" className="flex min-h-[44px] items-center gap-2" aria-label="N10 sessions">
            <span className="rounded-lg bg-n10-lime px-2 py-1 text-sm font-black text-black">N10</span>
            <span className="font-bold text-white">Sessions</span>
          </Link>
          <button type="button" className="btn-secondary min-h-[44px] px-4 py-2 text-sm" onClick={() => setDriversOpen(true)}>
            Drivers{drivers.length ? ` (${drivers.length})` : ''}
          </button>
        </div>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 overflow-x-clip px-4 py-5">
        {storageFull && (
          <div role="alert" className="mb-4 rounded-xl border border-amber-300/50 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
            <span className="font-bold">Storage full, delete old sessions.</span> Your latest changes couldn&apos;t be saved on this device.
          </div>
        )}
        <Outlet />
      </main>
      <footer className="no-print border-t border-n10-border">
        <div className="mx-auto max-w-6xl space-y-1 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-sm text-n10-mute">
          <p className="font-semibold text-white">{SAFETY_LINE}</p>
          <p>N10 is independent and not affiliated with or endorsed by Briggs &amp; Stratton. LO206 and Briggs &amp; Stratton are trademarks of their owners.</p>
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
          <p className="pt-1 text-xs text-n10-mute/80" data-shell-version={SHELL_VERSION}>
            {SHELL_VERSION}
          </p>
        </div>
      </footer>
      <DriverSheet open={driversOpen} onClose={() => setDriversOpen(false)} />
    </div>
  )
}

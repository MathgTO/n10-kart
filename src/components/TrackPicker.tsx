import { useMemo, useState } from 'react'
import { TRACKS } from '@/data/tracks'
import { useSessions } from '@/hooks/SessionsContext'

export function TrackPicker() {
  const { prefs, setTrackId, favorites, toggleFavorite } = useSessions()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const current = TRACKS.find((t) => t.id === prefs.trackId) ?? TRACKS[0]

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    let list = [...TRACKS]
    if (query) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.region.toLowerCase().includes(query) ||
          t.location.toLowerCase().includes(query)
      )
    }
    list.sort((a, b) => {
      if (a.home && !b.home) return -1
      if (!a.home && b.home) return 1
      const af = favorites.includes(a.id) ? 0 : 1
      const bf = favorites.includes(b.id) ? 0 : 1
      if (af !== bf) return af - bf
      return a.name.localeCompare(b.name)
    })
    return list
  }, [q, favorites])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="max-w-[12rem] sm:max-w-[16rem] truncate rounded-lg border border-n10-border bg-n10-card px-3 py-1.5 text-left text-sm text-n10-soft hover:border-n10-lime/40"
      >
        {current.name}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-n10-border bg-n10-panel p-3 shadow-xl">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tracks…"
              className="w-full rounded-lg border border-n10-border bg-black px-3 py-2 text-base text-white placeholder:text-neutral-500"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full bg-n10-lime/15 px-3 py-1 text-xs font-semibold text-n10-lime"
                onClick={() => {
                  setTrackId('mosport')
                  setOpen(false)
                }}
              >
                Home · Mosport
              </button>
              <button
                type="button"
                className="rounded-full border border-n10-border px-3 py-1 text-xs font-semibold text-n10-soft"
                onClick={() => setQ('Ontario')}
              >
                Ontario
              </button>
            </div>
            <ul className="mt-2 max-h-64 overflow-y-auto divide-y divide-n10-border">
              {filtered.map((t) => (
                <li key={t.id} className="flex items-center gap-2 py-2">
                  <button
                    type="button"
                    className="flex-1 text-left"
                    onClick={() => {
                      setTrackId(t.id)
                      setOpen(false)
                    }}
                  >
                    <div className="text-sm font-semibold text-white">
                      {t.home ? '📌 ' : ''}
                      {t.name}
                    </div>
                    <div className="text-xs text-n10-mute">
                      {t.region}
                      {t.location ? ` · ${t.location}` : ''}
                    </div>
                  </button>
                  <button
                    type="button"
                    aria-label="Favorite"
                    className="px-2 text-lg"
                    onClick={() => toggleFavorite(t.id)}
                  >
                    {favorites.includes(t.id) ? '★' : '☆'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

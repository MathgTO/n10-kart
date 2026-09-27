import { useRef } from 'react'
import type { StoredSession } from '@/lib/types'
import { useSessions } from '@/hooks/SessionsContext'

export function VideoPanel({ session }: { session: StoredSession }) {
  const { attachVideo } = useSessions()
  const ref = useRef<HTMLInputElement>(null)
  return (
    <section className="panel">
      <h2 className="text-xl font-bold">Kart-cam (optional)</h2>
      <p className="text-sm text-n10-soft mt-1">
        Secondary to MyChron. Attach onboard video for cue markers — never required for Coach call.
      </p>
      <input
        ref={ref}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) attachVideo(session.id, f)
        }}
      />
      {!session.videoObjectUrl ? (
        <button type="button" className="btn-secondary mt-3" onClick={() => ref.current?.click()}>
          Attach kart-cam video
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          <video src={session.videoObjectUrl} controls className="w-full rounded-xl bg-black" />
          <ul className="text-sm text-n10-soft">
            {(session.videoCueMarkers ?? []).map((m) => (
              <li key={m.t}>
                @{m.t}s — {m.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

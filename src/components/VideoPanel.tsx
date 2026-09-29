import { useRef, useState } from 'react'
import type { StoredSession } from '@/lib/types'
import { useSessions } from '@/hooks/SessionsContext'

/**
 * Narrow list: no video/* wildcard and never a `capture` attribute.
 * (A wildcard or `capture` makes iOS offer the camera, which the app has no permission strings for.)
 */
export const VIDEO_ACCEPT = '.mp4,.mov,video/mp4,video/quicktime'

function isVideoFile(file: File): boolean {
  if (file.type.startsWith('video/')) return true
  return /\.(mp4|mov|m4v)$/i.test(file.name)
}

export function VideoPanel({
  session,
  compact,
}: {
  session: StoredSession
  /** When true, render only the upload control (used near page top). */
  compact?: boolean
}) {
  const { attachVideo } = useSessions()
  const ref = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  function onPick(file: File | undefined) {
    setError(null)
    if (!file) return
    if (!isVideoFile(file)) {
      setError('Please choose an mp4 or mov video file.')
      return
    }
    attachVideo(session.id, file)
  }

  const input = (
    <input
      ref={ref}
      type="file"
      accept={VIDEO_ACCEPT}
      className="hidden"
      onChange={(e) => {
        onPick(e.target.files?.[0])
        e.target.value = ''
      }}
    />
  )

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {input}
        <button
          type="button"
          className="btn-primary text-base px-5 py-3"
          onClick={() => ref.current?.click()}
        >
          {session.videoObjectUrl ? 'Replace race video' : 'Upload race video'}
        </button>
        {session.videoName && (
          <span className="text-sm text-n10-soft truncate max-w-[14rem]">{session.videoName}</span>
        )}
        {error && <p className="w-full text-sm text-red-400">{error}</p>}
      </div>
    )
  }

  return (
    <section className="panel" id="session-video">
      <h2 className="text-xl font-bold">Onboard video</h2>
      <p className="text-sm text-n10-soft mt-1">
        Your kart-cam clip for this session, to watch next to the data. It stays on this device and
        isn&apos;t analyzed (the coaching comes from your logger file). It isn&apos;t kept after the app closes.
        Replace anytime.
      </p>
      {input}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      {!session.videoObjectUrl ? (
        <button type="button" className="btn-secondary mt-3" onClick={() => ref.current?.click()}>
          Attach onboard video
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          <video src={session.videoObjectUrl} controls className="w-full rounded-xl bg-black" />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn-secondary" onClick={() => ref.current?.click()}>
              Replace video
            </button>
            <span className="text-sm text-n10-soft">{session.videoName}</span>
          </div>
        </div>
      )}
    </section>
  )
}

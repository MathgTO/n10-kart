import { useState } from 'react'
import { Sheet } from './Sheet'
import { useSessions } from '@/hooks/SessionsContext'
import { shareReportCardPdf } from '@/lib/reportPdf'
import type { DriverSummary } from '@/lib/summary'
import type { DriverProfile, StoredSession } from '@/lib/types'

/**
 * One Share button → native share sheet with the report-card PDF attached.
 * No text preview, no phone/email fields, no copy / SMS / mailto paths.
 */
export function ShareSheet({
  open,
  onClose,
  session,
  summary,
}: {
  open: boolean
  onClose: () => void
  session: StoredSession
  summary: DriverSummary
  driver?: DriverProfile
}) {
  const { updateSessionMeta } = useSessions()
  const optIn = !!session.shareOptIn
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<'idle' | 'shared' | 'saved' | 'cancelled' | 'error'>('idle')

  const onShare = async () => {
    if (busy) return
    setBusy(true)
    setStatus('idle')
    try {
      const result = await shareReportCardPdf(summary)
      setStatus(result === 'cancelled' ? 'cancelled' : result)
    } catch {
      setStatus('error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={`Share ${summary.title}`}>
      <label className="flex min-h-[48px] items-center justify-between gap-3 rounded-xl border border-n10-border bg-n10-card px-4 py-3">
        <span>
          <span className="block font-semibold text-white">Share this report</span>
          <span className="block text-sm text-n10-mute">Off by default. Nothing leaves this device unless you send the PDF.</span>
        </span>
        <input
          type="checkbox"
          className="h-6 w-6 accent-[#c8f542]"
          checked={optIn}
          onChange={(e) => {
            updateSessionMeta(session.id, { shareOptIn: e.target.checked })
            setStatus('idle')
          }}
        />
      </label>

      {optIn && (
        <div className="mt-4 space-y-3">
          <button type="button" className="btn-primary min-h-[48px] w-full" disabled={busy} onClick={() => void onShare()}>
            {busy ? 'Preparing PDF…' : 'Share'}
          </button>
          {status === 'shared' && <p className="text-sm text-n10-soft">Shared the report-card PDF.</p>}
          {status === 'saved' && <p className="text-sm text-n10-soft">PDF saved on this device — attach it from Files / Downloads.</p>}
          {status === 'cancelled' && <p className="text-sm text-n10-mute">Share cancelled.</p>}
          {status === 'error' && <p className="text-sm text-rose-300">Couldn’t prepare the PDF. Try again.</p>}
          <p className="text-sm text-n10-mute">Sends the driving report card as a PDF only — no setup numbers, sprockets or PSI.</p>
        </div>
      )}
    </Sheet>
  )
}

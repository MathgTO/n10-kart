import { useState } from 'react'
import { Sheet } from './Sheet'
import { useSessions } from '@/hooks/SessionsContext'
import { getClassConfig } from '@/lib/classConfig'
import { getTrack } from '@/data/tracks'
import { shareReportCardPdf } from '@/lib/reportPdf'
import { sessionLocal } from '@/lib/sessionLabel'
import type { DriverSummary } from '@/lib/summary'
import type { DriverProfile, StoredSession } from '@/lib/types'

/**
 * One-tap Share → native share sheet with the branded report-card PDF.
 * Privacy stays opt-in in spirit (nothing leaves until you send), with less friction:
 * primary button shares; a quiet privacy line sits under it. First share marks opt-in.
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
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<'idle' | 'shared' | 'saved' | 'cancelled' | 'error'>('idle')

  const onShare = async () => {
    if (busy) return
    setBusy(true)
    setStatus('idle')
    try {
      if (!session.shareOptIn) updateSessionMeta(session.id, { shareOptIn: true })
      const track = getTrack(session.trackId)
      const local = sessionLocal(session)
      const dateLabel = local
        ? `${local.monthShort} ${local.day}${local.year ? `, ${local.year}` : ''}`
        : undefined
      const result = await shareReportCardPdf(summary, {
        trackLabel: track.name,
        dateLabel,
        classLabel: getClassConfig(session.classId).label,
      })
      setStatus(result === 'cancelled' ? 'cancelled' : result)
    } catch {
      setStatus('error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={`Share ${summary.title}`}>
      <div className="space-y-3">
        <button type="button" className="btn-primary min-h-[48px] w-full" disabled={busy} onClick={() => void onShare()}>
          {busy ? 'Preparing PDF…' : 'Share PDF'}
        </button>
        <p className="text-sm text-n10-mute">
          Private — driving report only. Nothing leaves this device until you send the PDF. No setup numbers, sprockets or PSI.
        </p>
        {status === 'shared' && <p className="text-sm text-n10-soft">Shared the report-card PDF.</p>}
        {status === 'saved' && <p className="text-sm text-n10-soft">PDF saved on this device — attach it from Files / Downloads.</p>}
        {status === 'cancelled' && <p className="text-sm text-n10-mute">Share cancelled.</p>}
        {status === 'error' && <p className="text-sm text-rose-300">Couldn’t prepare the PDF. Try again.</p>}
      </div>
    </Sheet>
  )
}

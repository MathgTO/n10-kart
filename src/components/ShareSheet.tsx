import { useState } from 'react'
import { Sheet } from './Sheet'
import { useSessions } from '@/hooks/SessionsContext'
import type { DriverSummary } from '@/lib/summary'
import type { DriverProfile, StoredSession } from '@/lib/types'

/**
 * Share the school report (Keep / Start / Stop / Overall). Opt-in per session; nothing is uploaded —
 * text goes through the device share sheet, Messages (sms:) or Mail (mailto:), and the PDF is printed locally.
 * Contact is stored on the driver profile on this device only. Coach voice is not attached (browsers can't
 * export speech audio); the same words are in the message.
 */
export function ShareSheet({ open, onClose, session, summary, driver }: { open: boolean; onClose: () => void; session: StoredSession; summary: DriverSummary; driver?: DriverProfile }) {
  const { updateSessionMeta, upsertDriver } = useSessions()
  const optIn = !!session.shareOptIn
  const [phone, setPhone] = useState(driver?.shareContact?.phone ?? '')
  const [email, setEmail] = useState(driver?.shareContact?.email ?? '')
  const [copied, setCopied] = useState(false)
  const { sms, emailSubject, emailBody } = summary.share

  const saveContact = () => {
    if (driver && (phone !== (driver.shareContact?.phone ?? '') || email !== (driver.shareContact?.email ?? ''))) {
      upsertDriver({ ...driver, shareContact: { phone: phone || undefined, email: email || undefined } })
    }
  }
  const smsHref = `sms:${encodeURIComponent(phone)}${/iPad|iPhone|Mac/.test(navigator.userAgent) ? '&' : '?'}body=${encodeURIComponent(sms)}`
  const mailHref = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  return (
    <Sheet open={open} onClose={onClose} title={`Share ${summary.title}`}>
      <label className="flex min-h-[48px] items-center justify-between gap-3 rounded-xl border border-n10-border bg-n10-card px-4 py-3">
        <span>
          <span className="block font-semibold text-white">Share this report</span>
          <span className="block text-sm text-n10-mute">Off by default. Nothing leaves this device unless you send it.</span>
        </span>
        <input type="checkbox" className="h-6 w-6 accent-[#c8f542]" checked={optIn} onChange={(e) => updateSessionMeta(session.id, { shareOptIn: e.target.checked })} />
      </label>

      {optIn && (
        <div className="mt-4 space-y-4">
          <div>
            <p className="label-lg">Text message preview</p>
            <p className="mt-1 rounded-xl border border-n10-border bg-black/50 p-3 text-base leading-relaxed text-n10-soft">{sms}</p>
            <p className={`mt-1 text-sm ${sms.length > 320 ? 'text-rose-300' : 'text-n10-mute'}`}>{sms.length} / 320 characters</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-n10-soft">
              Phone (optional)
              <input className="mt-1 block min-h-[48px] w-full rounded-lg border border-n10-border bg-black px-3 text-base text-white" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={saveContact} placeholder="Saved on this device" />
            </label>
            <label className="block text-sm font-semibold text-n10-soft">
              Email (optional)
              <input className="mt-1 block min-h-[48px] w-full rounded-lg border border-n10-border bg-black px-3 text-base text-white" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={saveContact} placeholder="Saved on this device" />
            </label>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {canNativeShare && (
              <button
                type="button"
                className="btn-primary min-h-[48px] sm:col-span-2"
                onClick={() => {
                  saveContact()
                  void navigator.share({ title: emailSubject, text: sms }).catch(() => undefined)
                }}
              >
                Share…
              </button>
            )}
            <a className="btn-secondary min-h-[48px]" href={smsHref} onClick={saveContact}>
              Text (SMS)
            </a>
            <a className="btn-secondary min-h-[48px]" href={mailHref} onClick={saveContact}>
              Email
            </a>
            <button
              type="button"
              className="btn-secondary min-h-[48px]"
              onClick={() => {
                void navigator.clipboard?.writeText(`${emailSubject}\n\n${emailBody}`).then(() => {
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1800)
                })
              }}
            >
              {copied ? 'Copied ✓' : 'Copy text'}
            </button>
            <button
              type="button"
              className="btn-secondary min-h-[48px]"
              onClick={() => {
                onClose()
                setTimeout(() => window.print(), 150)
              }}
            >
              Save PDF
            </button>
          </div>
          <details className="rounded-xl border border-n10-border bg-n10-card p-3">
            <summary className="min-h-[32px] cursor-pointer font-semibold text-white">Email preview</summary>
            <p className="mt-2 font-semibold text-white">{emailSubject}</p>
            <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-n10-soft">{emailBody}</pre>
          </details>
          <p className="text-sm text-n10-mute">
            Shares the driving report only — no setup numbers, sprockets or PSI. Coach voice isn’t attached (the same words are in the message).
          </p>
        </div>
      )}
    </Sheet>
  )
}

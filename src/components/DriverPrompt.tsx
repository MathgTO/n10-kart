import { useState } from 'react'
import { Sheet } from './Sheet'
import { useSessions } from '@/hooks/SessionsContext'
import { initial, newDriverId, serialTail } from '@/lib/drivers'
import type { StoredSession } from '@/lib/types'

/** "Whose MyChron is this?" — asked once for an unknown logger serial, or from "Wrong driver?". */
export function DriverPrompt({ open, onClose, session, reason }: { open: boolean; onClose: () => void; session: StoredSession; reason: 'unknown' | 'wrong' }) {
  const { drivers, assignDriver, upsertDriver } = useSessions()
  const [bind, setBind] = useState(true)
  const [newName, setNewName] = useState('')
  const serial = session.logger?.serial
  const model = session.logger?.model ?? 'MyChron'
  const pick = (id: string) => {
    assignDriver(session.id, id, bind && serial != null)
    onClose()
  }
  return (
    <Sheet open={open} onClose={onClose} title={reason === 'unknown' ? `Whose ${model} is this?` : 'Who was driving?'}>
      <p className="text-base text-n10-soft">
        {serial != null ? `${model} · ${serialTail(serial)}. ` : ''}
        {reason === 'unknown' ? 'Pick once — future files from this logger go straight to that driver.' : 'Change the driver for this session.'}
      </p>
      <div className="mt-3 space-y-2">
        {drivers.map((d) => (
          <button key={d.id} type="button" className={`flex min-h-[56px] w-full items-center gap-3 rounded-xl border px-4 text-left ${session.driverId === d.id ? 'border-n10-lime bg-n10-lime/10' : 'border-n10-border bg-n10-card'}`} onClick={() => pick(d.id)}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-n10-lime font-bold text-black">{initial(d.displayName)}</span>
            <span className="font-semibold text-white">{d.displayName}</span>
          </button>
        ))}
        <div className="flex gap-2">
          <input className="min-h-[48px] flex-1 rounded-lg border border-n10-border bg-black px-3 text-base text-white" placeholder="New driver name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button
            type="button"
            className="btn-secondary min-h-[48px]"
            disabled={!newName.trim()}
            onClick={() => {
              const id = newDriverId(newName)
              upsertDriver({ id, displayName: newName.trim(), kidCard: true, classDefault: session.classId ?? 'junior_light', boundLoggers: [] })
              // assign after the driver exists
              setTimeout(() => pick(id), 0)
            }}
          >
            Add
          </button>
        </div>
      </div>
      {serial != null && (
        <label className="mt-4 flex min-h-[48px] items-center justify-between gap-3 rounded-xl border border-n10-border bg-n10-card px-4">
          <span className="font-semibold text-white">Always use this driver for {model} {serialTail(serial)}</span>
          <input type="checkbox" className="h-6 w-6 accent-[#c8f542]" checked={bind} onChange={(e) => setBind(e.target.checked)} />
        </label>
      )}
    </Sheet>
  )
}

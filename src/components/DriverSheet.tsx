import { useState } from 'react'
import { Sheet } from './Sheet'
import { useSessions } from '@/hooks/SessionsContext'
import { CLASS_OPTIONS, getClassConfig } from '@/lib/classConfig'
import { defaultKidCard, initial, newDriverId, serialTail } from '@/lib/drivers'
import type { DriverProfile } from '@/lib/types'

function DriverForm({ d, onDone }: { d: DriverProfile; onDone: () => void }) {
  const { upsertDriver, deleteDriver, unbindLogger, sessions } = useSessions()
  const [name, setName] = useState(d.displayName)
  const [age, setAge] = useState(d.age != null ? String(d.age) : '')
  const [cls, setCls] = useState(d.classDefault ?? 'junior_light')
  const [kid, setKid] = useState(d.kidCard)
  const count = sessions.filter((s) => s.driverId === d.id).length
  const input = 'mt-1 block min-h-[48px] w-full rounded-lg border border-n10-border bg-black px-3 text-base text-white'
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-n10-soft">
        Name
        <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-semibold text-n10-soft">
          Age (optional)
          <input
            className={input}
            inputMode="numeric"
            value={age}
            onChange={(e) => {
              setAge(e.target.value)
              const n = Number(e.target.value)
              if (Number.isFinite(n) && n > 0) setKid(defaultKidCard(n))
            }}
          />
        </label>
        <label className="block text-sm font-semibold text-n10-soft">
          Usual class
          <select className={input} value={cls} onChange={(e) => setCls(e.target.value)}>
            {CLASS_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {getClassConfig(c).label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex min-h-[48px] items-center justify-between gap-3 rounded-xl border border-n10-border bg-n10-card px-4">
        <span className="font-semibold text-white">Kid report card (school letters, kid voice)</span>
        <input type="checkbox" className="h-6 w-6 accent-[#c8f542]" checked={kid} onChange={(e) => setKid(e.target.checked)} />
      </label>
      <div>
        <p className="label-lg">Bound loggers</p>
        {d.boundLoggers.length === 0 ? (
          <p className="mt-1 text-sm text-n10-mute">None yet — the next file from an unknown MyChron asks once.</p>
        ) : (
          <ul className="mt-1 space-y-2">
            {d.boundLoggers.map((l) => (
              <li key={l.serial} className="flex items-center justify-between gap-2 rounded-lg border border-n10-border px-3 py-2">
                <span className="text-white">
                  {l.model ?? 'MyChron'} · {serialTail(l.serial)}
                </span>
                <button type="button" className="min-h-[44px] px-3 text-sm font-semibold text-rose-300" onClick={() => unbindLogger(l.serial)}>
                  Unbind
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-sm text-n10-mute">Stored only on this device. {count} session{count === 1 ? '' : 's'}.</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary min-h-[48px] flex-1"
          disabled={!name.trim()}
          onClick={() => {
            upsertDriver({
              ...d,
              displayName: name.trim(),
              age: age ? Number(age) : undefined,
              classDefault: cls,
              kidCard: kid,
            })
            onDone()
          }}
        >
          Save driver
        </button>
        <button
          type="button"
          className="btn-secondary min-h-[48px] text-rose-300"
          onClick={() => {
            if (!window.confirm(`Delete ${d.displayName}? Their sessions stay but lose the driver.`)) return
            deleteDriver(d.id)
            onDone()
          }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export function DriverSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { drivers } = useSessions()
  const [editing, setEditing] = useState<DriverProfile | null>(null)
  return (
    <Sheet open={open} onClose={() => { setEditing(null); onClose() }} title={editing ? (editing.displayName || 'New driver') : 'Drivers'}>
      {editing ? (
        <DriverForm d={editing} onDone={() => setEditing(null)} />
      ) : (
        <div className="space-y-2">
          {drivers.map((d) => (
            <button key={d.id} type="button" className="flex min-h-[56px] w-full items-center gap-3 rounded-xl border border-n10-border bg-n10-card px-4 text-left hover:border-n10-lime/50" onClick={() => setEditing(d)}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-n10-lime font-bold text-black">{initial(d.displayName)}</span>
              <span className="flex-1">
                <span className="block font-semibold text-white">{d.displayName}</span>
                <span className="block text-sm text-n10-mute">
                  {getClassConfig(d.classDefault).label} · {d.kidCard ? 'kid card' : 'adult card'}
                  {d.boundLoggers.length ? ` · ${d.boundLoggers.map((l) => `${l.model ?? 'MyChron'} ${serialTail(l.serial)}`).join(', ')}` : ''}
                </span>
              </span>
              <span className="text-n10-mute">›</span>
            </button>
          ))}
          <button
            type="button"
            className="btn-secondary min-h-[48px] w-full"
            onClick={() => setEditing({ id: newDriverId('driver'), displayName: '', kidCard: true, classDefault: 'junior_light', boundLoggers: [] })}
          >
            + Add driver
          </button>
        </div>
      )}
    </Sheet>
  )
}

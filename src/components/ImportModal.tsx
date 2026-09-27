import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessions } from '@/hooks/SessionsContext'
import { formatLapTime } from '@/lib/format'
import type { ParseResult } from '@/lib/csv'
import type { SeriesTag } from '@/lib/types'

/** iOS/iPad greys out unknown types (.xrk/.xrz) if accept is extension-only. Allow all; validate in importFile. */
const ACCEPT = '*/*'

interface Props {
  open: boolean
  onClose: () => void
}

export function ImportModal({ open, onClose }: Props) {
  const { importFile, prefs, setSeries } = useSessions()
  const nav = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [parse, setParse] = useState<ParseResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function handleFile(file: File) {
    setBusy(true)
    setError(null)
    setParse(null)
    try {
      const result = await importFile(file)
      setParse(result.parse)
      if (!result.session) {
        setError(result.parse.message)
        setBusy(false)
        return
      }
      onClose()
      nav(`/session/${result.session.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-n10-border bg-n10-panel p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Import session</h2>
            <p className="mt-1 text-sm text-n10-soft">
              Drop a Race Studio{' '}
              <span className="text-n10-lime font-semibold">.xrk</span> /{' '}
              <span className="text-n10-lime font-semibold">.xrz</span> or CSV
            </p>
          </div>
          <button type="button" className="text-n10-mute text-2xl leading-none" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="mt-4">
          <label className="label-lg">Series</label>
          <select
            className="mt-1 w-full rounded-lg border border-n10-border bg-black px-3 py-2 text-base"
            value={prefs.series}
            onChange={(e) => setSeries(e.target.value as SeriesTag)}
          >
            <option value="practice">practice</option>
            <option value="mika">mika</option>
            <option value="bsc_ontario">bsc_ontario</option>
            <option value="qualifying">qualifying</option>
            <option value="race">race</option>
            <option value="other">other</option>
          </select>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFile(f)
          }}
        />

        <button
          type="button"
          disabled={busy}
          className={`mt-4 w-full rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
            dragging
              ? 'border-n10-lime bg-n10-lime/10'
              : 'border-n10-lime/50 bg-n10-lime/5 hover:border-n10-lime'
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            const f = e.dataTransfer.files?.[0]
            if (f) void handleFile(f)
          }}
        >
          <span className="block text-lg font-bold text-n10-lime">
            {busy ? 'Importing…' : 'Choose or drop file'}
          </span>
          <span className="mt-2 block text-sm text-n10-soft">
            .xrk / .xrz / .csv · on iPad use Browse → Files (all files selectable)
          </span>
        </button>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        {parse && parse.ok && parse.laps.length > 0 && (
          <div className="mt-3 rounded-xl border border-n10-lime/30 bg-n10-lime/5 p-3 text-sm">
            <p className="font-semibold text-n10-lime">Import OK</p>
            <p className="text-n10-soft mt-1">
              {parse.laps.length} laps · best{' '}
              {formatLapTime(Math.min(...parse.laps.map((l) => l.timeMs)))} · speed{' '}
              {parse.channels.speed ? 'yes' : 'no'} · RPM {parse.channels.rpm ? 'yes' : 'no'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

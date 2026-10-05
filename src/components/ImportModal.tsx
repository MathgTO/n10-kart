import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessions } from '@/hooks/SessionsContext'
import { formatLapTime } from '@/lib/format'
import type { ParseResult } from '@/lib/csv'
import type { SeriesTag } from '@/lib/types'
import { SERIES_OPTIONS, seriesLabel } from '@/lib/labels'

/**
 * Session files only: no wildcard, no image/video types and never a `capture` attribute, so iOS
 * never offers the camera. `.xrk`/`.xrz` have no registered MIME type in Safari, so
 * application/octet-stream (generic binary) keeps them selectable instead of greyed out.
 * importFile still validates the content.
 */
export const IMPORT_ACCEPT = [
  '.xrk',
  '.xrz',
  '.csv',
  'text/csv',
  'text/comma-separated-values',
  'application/csv',
  'application/vnd.ms-excel',
  'application/octet-stream',
  'application/x-xrk',
  'application/x-xrz',
].join(',')

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
      nav(`/session/${result.session.id}/setup`, { state: { fresh: true } })
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
              Reads your MyChron: native{' '}
              <span className="text-n10-lime font-semibold">.xrk</span> /{' '}
              <span className="text-n10-lime font-semibold">.xrz</span>, or Race Studio CSV with
              Lap / Time / Speed / RPM / Distance (sector columns recognized when present).
            </p>
          </div>
          <button type="button" className="min-h-[48px] min-w-[48px] text-n10-mute text-2xl leading-none" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="mt-4">
          <label className="label-lg">Session type</label>
          <select
            className="mt-1 min-h-[48px] w-full rounded-lg border border-n10-border bg-black px-3 py-2 text-base"
            value={prefs.series}
            onChange={(e) => setSeries(e.target.value as SeriesTag)}
          >
            {SERIES_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {seriesLabel(o)}
              </option>
            ))}
          </select>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={IMPORT_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = '' // allow picking the same file again
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
            .xrk / .xrz / .csv · track, date and driver are read from the file · on iPad use Browse → Files
          </span>
        </button>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        {parse && (
          <div
            className={`mt-3 rounded-xl border p-3 text-sm ${
              parse.ok && parse.laps.length > 0
                ? 'border-n10-lime/30 bg-n10-lime/5'
                : 'border-n10-border bg-black/40'
            }`}
          >
            {parse.ok && parse.laps.length > 0 ? (
              <>
                <p className="font-semibold text-n10-lime">Import OK</p>
                <p className="text-n10-soft mt-1">
                  {parse.laps.length} laps · best{' '}
                  {formatLapTime(Math.min(...parse.laps.map((l) => l.timeMs)))} · speed{' '}
                  {parse.channels.speed ? 'yes' : 'no'} · RPM {parse.channels.rpm ? 'yes' : 'no'}
                </p>
              </>
            ) : (
              <p className="font-semibold text-n10-soft">Parse notes</p>
            )}
            <p className="text-n10-mute mt-1 text-xs leading-relaxed">{parse.message}</p>
            {parse.unmappedColumns && parse.unmappedColumns.length > 0 && (
              <p className="text-amber-300/90 mt-1 text-xs">
                Unmapped columns: {parse.unmappedColumns.join(', ')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

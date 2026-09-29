import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessions } from '@/hooks/SessionsContext'
import { isNative } from './platform'

const IMPORTABLE = /\.(xrk|xrz|csv)$/i

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function fileNameFromUrl(url: string): string {
  const last = url.split('?')[0].split('/').pop() || 'session'
  try {
    return decodeURIComponent(last)
  } catch {
    return last
  }
}

/**
 * iOS shell only. Handles "Open in N10" / AirDrop / Files / RaceStudio 3 share-sheet hand-offs.
 *
 * SceneDelegate.swift stages the incoming document at Documents/Imports/<name> (security-scoped,
 * coordinated read) before Capacitor's App plugin emits appUrlOpen with the original URL.
 * Here we read it with @capacitor/filesystem, wrap it in a File, and run the same on-device
 * import path as the web file picker. Renders nothing on the web.
 */
export function NativeFileOpen() {
  const { importFile } = useSessions()
  const nav = useNavigate()
  const handled = useRef(new Set<string>())
  const importRef = useRef(importFile)
  importRef.current = importFile
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    if (!isNative) return
    let cancelled = false
    let remove: (() => void) | undefined

    async function handleUrl(url: string | undefined) {
      if (!url || !url.startsWith('file:')) return
      if (handled.current.has(url)) return
      handled.current.add(url)
      const name = fileNameFromUrl(url)
      if (!IMPORTABLE.test(name)) {
        setNotice({ kind: 'err', text: `N10 can't read “${name}”. Use a MyChron .xrk / .xrz or a Race Studio CSV.` })
        return
      }
      try {
        const { Filesystem, Encoding, Directory } = await import('@capacitor/filesystem')
        const isCsv = /\.csv$/i.test(name)
        // 1) Read the URL directly (works for Documents/Inbox and files already in N10's folder).
        // 2) Otherwise read the copy SceneDelegate.swift staged at Documents/Imports/<name>
        //    (security-scoped files from Files / iCloud Drive / other apps).
        const read = async (opts: { path: string; directory?: (typeof Directory)[keyof typeof Directory] }) =>
          isCsv ? Filesystem.readFile({ ...opts, encoding: Encoding.UTF8 }) : Filesystem.readFile(opts)
        let r
        try {
          r = await read({ path: url })
        } catch {
          r = await read({ path: `Imports/${name}`, directory: Directory.Documents })
        }
        let file: File
        if (isCsv) {
          const text = typeof r.data === 'string' ? r.data : await r.data.text()
          file = new File([text], name, { type: 'text/csv' })
        } else {
          const bytes = typeof r.data === 'string' ? base64ToBytes(r.data) : new Uint8Array(await r.data.arrayBuffer())
          file = new File([bytes], name, { type: 'application/octet-stream' })
        }
        const result = await importRef.current(file)
        if (cancelled) return
        if (!result.session) {
          setNotice({ kind: 'err', text: result.parse.message || `Couldn't import “${name}”.` })
          return
        }
        setNotice({ kind: 'ok', text: `Imported “${name}”.` })
        nav(`/session/${result.session.id}`)
      } catch (e) {
        setNotice({ kind: 'err', text: e instanceof Error ? e.message : `Couldn't import “${name}”.` })
      }
    }

    void (async () => {
      try {
        const { App } = await import('@capacitor/app')
        const h = await App.addListener('appUrlOpen', (ev) => void handleUrl(ev.url))
        remove = () => void h.remove()
        if (cancelled) return remove()
        const launch = await App.getLaunchUrl()
        await handleUrl(launch?.url)
      } catch (e) {
        console.warn('[n10] file-open wiring unavailable', e)
      }
    })()

    return () => {
      cancelled = true
      remove?.()
    }
  }, [nav])

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 5000)
    return () => clearTimeout(t)
  }, [notice])

  if (!isNative || !notice) return null
  return (
    <div
      role="status"
      className={`fixed left-1/2 -translate-x-1/2 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[60] max-w-md rounded-xl border px-4 py-3 text-sm shadow-2xl ${
        notice.kind === 'ok' ? 'border-n10-lime/40 bg-n10-panel text-white' : 'border-red-300/40 bg-n10-panel text-red-200'
      }`}
      onClick={() => setNotice(null)}
    >
      {notice.text}
    </div>
  )
}

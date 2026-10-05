import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImportModal, isDesktop } from '@/components/ImportModal'
import { useSessions } from '@/hooks/SessionsContext'

const STEPS_IN = [
  {
    n: '1',
    title: 'Export',
    body: 'From Race Studio 3, save this outing as a MyChron .xrk or .xrz file.',
  },
  {
    n: '2',
    title: 'Open in N10',
    body: 'Any browser, any device. Session stays on your device.',
  },
]
const STEPS_REPORT = [
  {
    n: '3',
    title: 'Race report',
    body: 'Laps, sectors, delta, speed, RPM, plus Keep / Start / Stop grades.',
  },
  {
    n: '4',
    title: 'Notes',
    body: 'Coaching note for the driver. Setup note for the tuner.',
  },
]

function useInViewOnce<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || visible) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [visible])
  return { ref, visible }
}

function FadeIn({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { ref, visible } = useInViewOnce<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`transition duration-700 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  )
}

function UploadIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 16V4m0 0 4 4m-4-4-4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 16.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function isXrkOrXrz(file: File) {
  const name = file.name.toLowerCase()
  return name.endsWith('.xrk') || name.endsWith('.xrz')
}

export function LandingFirstVisit() {
  const { importFile } = useSessions()
  const nav = useNavigate()
  const [importOpen, setImportOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const [picked, setPicked] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)


  function openSession() {
    setImportOpen(true)
  }

  function scrollToSteps(e: { preventDefault: () => void }) {
    e.preventDefault()
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function runImport(file: File) {
    if (!isXrkOrXrz(file)) {
      setError('Drop a MyChron .xrk or .xrz file')
      setPicked(null)
      return
    }
    setPicked(file)
    setBusy(true)
    setError(null)
    try {
      const result = await importFile(file)
      if (!result.session) {
        setError(result.parse.message || 'Import failed')
        setBusy(false)
        return
      }
      if (result.alreadyImported) {
        nav(
          result.session.setupConfirmed === false
            ? `/session/${result.session.id}/setup`
            : `/session/${result.session.id}`,
        )
        return
      }
      nav(`/session/${result.session.id}/setup`, { state: { fresh: true } })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
      setBusy(false)
    }
  }

  function clearPicked() {
    setPicked(null)
    setError(null)
    setBusy(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const acceptAttr = isDesktop() ? undefined : '.xrk,.xrz,application/octet-stream'

  return (
    <div className="relative pb-10">

      {/* Hero */}
      <section className="flex flex-col gap-3 pt-2 sm:gap-4 sm:pt-4">
        <p className="text-xs font-medium uppercase tracking-widest text-n10-soft sm:text-sm">
          MyChron coaching for Briggs LO206 — any browser
        </p>
        <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-6xl sm:tracking-[-0.03em]">
          Shave the Next Tenth
        </h1>
        <p className="max-w-xl text-base font-normal leading-relaxed text-n10-soft sm:text-lg">
          Full race report, coaching note, and setup note from your MyChron session — between heats,
          on whatever device is in your hand.
        </p>

        <div className="mt-2 flex w-full max-w-md flex-col gap-3">
          <button
            type="button"
            className="btn-primary min-h-[56px] w-full px-8 text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-n10-lime/40 sm:w-auto sm:self-start"
            onClick={openSession}
          >
            Open a session
          </button>

          {/* Upload drop zone — secondary to primary CTA */}
          {picked ? (
            <div className="flex min-h-[56px] w-full max-w-md items-center gap-3 rounded-xl border-2 border-dashed border-n10-border bg-n10-card/60 px-4 py-3">
              <UploadIcon className="h-6 w-6 shrink-0 text-n10-mute" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{picked.name}</p>
                <p className="text-xs text-n10-mute">
                  {busy ? 'Importing…' : picked.name.toLowerCase().endsWith('.xrz') ? '.xrz' : '.xrk'}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-n10-border px-2 py-0.5 text-xs font-semibold uppercase text-n10-soft">
                {picked.name.toLowerCase().endsWith('.xrz') ? '.xrz' : '.xrk'}
              </span>
              <button
                type="button"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center text-n10-mute hover:text-white"
                aria-label="Remove file"
                onClick={clearPicked}
                disabled={busy}
              >
                ×
              </button>
            </div>
          ) : (
            <label
              className={`flex min-h-[56px] w-full max-w-md cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 transition ${
                dragging
                  ? 'border-n10-lime bg-n10-lime/5'
                  : 'border-n10-border bg-n10-card/60 hover:border-n10-mute/60'
              }`}
              onDragEnter={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={(e) => {
                if (e.currentTarget === e.target) setDragging(false)
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setDragging(false)
                const f = e.dataTransfer.files?.[0]
                if (f) void runImport(f)
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptAttr}
                className="sr-only"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  if (f) void runImport(f)
                }}
              />
              <UploadIcon className="h-6 w-6 shrink-0 text-n10-mute" />
              <span className="min-w-0 text-left">
                <span className="block text-sm font-semibold text-white">Upload your session</span>
                <span className="mt-0.5 block text-xs text-n10-mute">
                  Drop a MyChron .xrk or .xrz file
                </span>
              </span>
            </label>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}

          <a
            href="#how-it-works"
            onClick={scrollToSteps}
            className="inline-flex min-h-[44px] items-center text-sm font-semibold text-n10-soft underline-offset-4 hover:text-n10-lime hover:underline"
          >
            See how it works →
          </a>
        </div>
      </section>

      {/* Advantage */}
      <section className="mt-10 sm:mt-12" aria-label="Advantage">
        <div className="grid gap-4 rounded-2xl border border-n10-border bg-n10-card/40 p-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-6 sm:p-6">
          <p className="text-sm leading-relaxed text-n10-mute sm:text-base">
            Race Studio 3 can export on any device or OS it runs on. Full Race Studio 3 analysis still
            needs Windows.
          </p>
          <div className="hidden h-16 w-px bg-n10-border sm:block" aria-hidden />
          <div className="border-t border-n10-border pt-4 sm:border-t-0 sm:pt-0">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-n10-lime/80 sm:hidden">
              vs
            </p>
            <p className="mt-2 text-sm leading-relaxed text-n10-soft sm:mt-0 sm:text-base">
              N10 does the analysis in{' '}
              <span className="font-semibold text-n10-lime">any browser</span>: race report, coaching
              note, setup note.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mt-10 scroll-mt-24 sm:mt-14" aria-labelledby="how-heading">
        <h2 id="how-heading" className="sr-only">
          How it works
        </h2>

        <FadeIn className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-n10-mute">Get the file in</p>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {STEPS_IN.map((s) => (
              <StepCard key={s.n} n={s.n} title={s.title} body={s.body} />
            ))}
          </div>
        </FadeIn>

        <FadeIn className="mt-8 space-y-3 sm:mt-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-n10-mute">Report</p>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {STEPS_REPORT.map((s) => (
              <StepCard key={s.n} n={s.n} title={s.title} body={s.body} />
            ))}
          </div>
          <p className="pt-2 text-center text-sm font-medium text-n10-soft sm:text-base">
            Same session. Two clear answers — the report and the notes.
          </p>
        </FadeIn>
      </section>

      {/* Below the fold */}
      <section className="mt-14 border-t border-n10-border pt-10 sm:mt-16" aria-label="Straight talk">
        <p className="max-w-2xl text-sm leading-relaxed text-n10-mute">
          N10 is not full Race Studio 3. No water, EGT, CHT, TPS, or brake-pressure maps. Race Studio 3
          stays the deep Windows tool. N10 is between-runs analysis on any device.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:items-start">
          <p className="text-base font-semibold text-white sm:text-lg">
            Open your last session in any browser. Try it free.
          </p>
          <button
            type="button"
            className="btn-primary min-h-[56px] w-full px-8 text-lg sm:w-auto"
            onClick={openSession}
          >
            Open a session
          </button>
        </div>
      </section>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}

function StepCard({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-n10-border bg-n10-panel p-4 sm:p-5">
      <span className="shrink-0 text-5xl font-black leading-none text-n10-lime sm:text-6xl md:text-7xl">
        {n}
      </span>
      <div className="min-w-0 pt-1">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-n10-mute">{body}</p>
      </div>
    </div>
  )
}

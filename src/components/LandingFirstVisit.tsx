import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ImportModal } from '@/components/ImportModal'

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

const FAQ = [
  {
    q: 'Is N10 a Race Studio 3 alternative?',
    a: 'For between-runs analysis on Mac and phone, yes. N10 reads your MyChron session in the browser and gives you lap times, delta, speed, RPM, a coaching note and a setup note before the next outing. Race Studio 3 remains the full Windows tool for deep analysis and logger configuration.',
  },
  {
    q: 'Does N10 work on Mac without Windows?',
    a: 'Yes. N10 runs in the browser on Mac, iPhone, iPad and Android — no Windows, Boot Camp or virtual machine needed. On iPhone or iPad, tap Share → Add to Home Screen to open it like an app. Your sessions stay on the device.',
  },
  {
    q: 'Which MyChron files does N10 read?',
    a: 'Native MyChron .xrk and .xrz files, and CSV files exported from Race Studio (lap, time, GPS speed, RPM, distance; sectors when present). Files are read on your device and sessions stay on the device.',
  },
  {
    q: 'What does N10 not do that Race Studio 3 does?',
    a: 'N10 is not full Race Studio 3 parity. It does not do water temp, EGT or CHT maps, TPS or brake pressure analysis, or full channel math. N10 focuses on laps, delta, speed, RPM and exit RPM, plus the coaching note and the setup note.',
  },
  {
    q: 'What karting data analysis does N10 do with a MyChron session?',
    a: 'N10 runs karting data analysis on your MyChron .xrk or .xrz in the browser: lap times, delta, speed and RPM, a session debrief coaching note, and LO206 setup notes from the data. Files stay on your device.',
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

export function LandingFirstVisit() {
  const [importOpen, setImportOpen] = useState(false)

  function openSession() {
    setImportOpen(true)
  }

  function scrollToSteps(e: { preventDefault: () => void }) {
    e.preventDefault()
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
            Upload a Session
          </button>

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

      {/* Questions (mirrors the FAQPage JSON-LD in index.html) */}
      <section className="mt-14 border-t border-n10-border pt-10 sm:mt-16" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-xl font-semibold text-white">
          Questions
        </h2>
        <dl className="mt-4 max-w-2xl space-y-5">
          {FAQ.map((f) => (
            <div key={f.q}>
              <dt className="text-base font-semibold text-white">{f.q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-n10-mute">{f.a}</dd>
            </div>
          ))}
        </dl>
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

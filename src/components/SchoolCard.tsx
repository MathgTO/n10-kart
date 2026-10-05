import type { DriverSummary, Subject } from '@/lib/summary'
import { GradeLetter } from './GradeLetter'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-n10-border bg-black/40 p-4">
      <p className="text-sm font-bold uppercase tracking-wide text-n10-lime">{title}</p>
      <div className="mt-2 text-base leading-relaxed text-white">{children}</div>
    </div>
  )
}

function DimRow({ s }: { s: Subject }) {
  const muted = s.letter == null
  return (
    <li className="flex items-start justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className={`font-semibold ${muted ? 'text-n10-mute' : 'text-white'}`}>{s.label}</p>
        {s.why && <p className="text-sm text-n10-soft">{s.why}</p>}
      </div>
      <span className="shrink-0 text-right">
        {s.letter ? (
          <GradeLetter letter={s.letter} className="text-n10-lime" size="lg" />
        ) : (
          <span className="block font-bold text-n10-mute">N/A</span>
        )}
        {s.estimate && s.letter && <span className="block text-xs font-semibold text-n10-mute">est.</span>}
      </span>
    </li>
  )
}

/** Driver/coach school report: Keep / Start / Stop / Overall prose (no letters) + the same graded dim set as Coach. */
export function SchoolCard({ summary, children }: { summary: DriverSummary; children?: React.ReactNode }) {
  const startTitle = summary.badDay ? 'Next focus' : 'Start doing'
  return (
    <section className="rounded-2xl border border-n10-lime/40 border-l-4 border-l-n10-lime bg-n10-panel p-4 sm:p-5 print-card">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-n10-lime">Driver report</p>
        <p className="text-sm text-n10-soft">Driving only · Tuner owns the kart checklist</p>
      </div>
      <div className="mt-4 space-y-3">
        <Section title="Keep doing">
          <p>{summary.keep.text}</p>
        </Section>
        <Section title={startTitle}>
          <p>{summary.start.text}</p>
          {summary.exitsNote && (
            <p className="mt-2 text-sm text-n10-soft">
              Corner exits: <span className="font-semibold text-n10-teal">{summary.exitsNote}</span>
            </p>
          )}
          <div className="mt-3 rounded-xl border border-n10-lime/40 bg-n10-lime/10 p-3">
            <p className="font-bold text-n10-lime">Your drill</p>
            <p className="text-white">{summary.start.drill}</p>
          </div>
        </Section>
        <Section title="Stop doing">
          <p>{summary.stop.text}</p>
        </Section>
        <Section title="Overall summary">
          <p>{summary.overallSentence}</p>
        </Section>

        <div className="rounded-xl border border-n10-border bg-black/40 p-4">
          <p className="text-sm font-bold uppercase tracking-wide text-n10-lime">Report card</p>
          <ul className="mt-2 divide-y divide-n10-border">
            {summary.face.map((s) => (
              <DimRow key={s.dimId} s={s} />
            ))}
          </ul>
          {summary.more.length > 0 && (
            <details className="mt-3 rounded-xl border border-n10-border bg-black/40 p-3">
              <summary className="min-h-[32px] cursor-pointer font-semibold text-white">More skills ({summary.more.length})</summary>
              <ul className="mt-2 divide-y divide-n10-border">
                {summary.more.map((m) => (
                  <DimRow key={m.dimId} s={m} />
                ))}
              </ul>
            </details>
          )}
        </div>

        {summary.fromVideo.length > 0 ? (
          <div className="rounded-xl border border-n10-lime/30 p-3">
            <p className="text-sm font-bold uppercase text-n10-lime">New from your video</p>
            <ul className="mt-1 divide-y divide-n10-border">
              {summary.fromVideo.map((v) => (
                <DimRow key={v.dimId} s={v} />
              ))}
            </ul>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-n10-border px-3 py-2 text-sm text-n10-soft">{summary.unlockLine}</p>
        )}
      </div>
      {children && <div className="mt-4 no-print">{children}</div>}
    </section>
  )
}

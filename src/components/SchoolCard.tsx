import type { DriverSummary, Subject } from '@/lib/summary'

function Grade({ s }: { s?: Subject }) {
  if (!s) return null
  return (
    <p className="mt-2 text-sm text-n10-soft">
      {s.label}: <span className="font-bold text-white">{s.letter}</span> <Draft />
    </p>
  )
}

export function Draft() {
  return <span className="ml-1 rounded-full border border-amber-300/50 px-2 py-0.5 align-middle text-xs font-bold text-amber-200">DRAFT</span>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-n10-border bg-black/40 p-4">
      <p className="text-sm font-bold uppercase tracking-wide text-n10-lime">{title}</p>
      <div className="mt-2 text-base leading-relaxed text-white">{children}</div>
    </div>
  )
}

/** Kid/adult school report: Keep / Start / Stop / Overall from the one DriverSummary. Teal setup card lives outside. */
export function SchoolCard({ summary, children }: { summary: DriverSummary; children?: React.ReactNode }) {
  const startTitle = summary.badDay ? 'Next focus' : 'Start doing'
  const shown = new Set([summary.keep.subject?.dimId, summary.start.subject?.dimId])
  const rest = summary.face.filter((f) => !shown.has(f.dimId))
  return (
    <section className="rounded-2xl border border-n10-lime/40 border-l-4 border-l-n10-lime bg-n10-panel p-4 sm:p-5 print-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-n10-lime">{summary.kid ? 'School report' : 'Driver report'}</p>
          <p className="text-sm text-n10-soft">{summary.kid ? 'Driving only · Dad owns the kart checklist' : 'Driving only · setup is on the tuner card'}</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-black leading-none text-n10-lime">{summary.overall ?? '—'}</p>
          <p className="mt-1 text-sm text-n10-soft">
            Overall <Draft />
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <Section title="Keep doing">
          <p>{summary.keep.text}</p>
          <Grade s={summary.keep.subject} />
        </Section>
        <Section title={startTitle}>
          <p>{summary.start.text}</p>
          <Grade s={summary.start.subject} />
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
          {rest.map((r) => (
            <Grade key={r.dimId} s={r} />
          ))}
        </Section>
        {summary.more.length > 0 && (
          <details className="rounded-xl border border-n10-border bg-black/40 p-3">
            <summary className="min-h-[32px] cursor-pointer font-semibold text-white">More skills ({summary.more.length})</summary>
            <ul className="mt-2 space-y-1">
              {summary.more.map((m) => (
                <li key={m.dimId} className="flex justify-between text-base text-n10-soft">
                  <span>{m.label}</span>
                  <span className="font-bold text-white">{m.letter}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
        {summary.fromVideo.length > 0 ? (
          <div className="rounded-xl border border-n10-lime/30 p-3">
            <p className="text-sm font-bold uppercase text-n10-lime">New from your video</p>
            {summary.fromVideo.map((v) => (
              <p key={v.dimId} className="flex justify-between text-base text-white">
                <span>{v.label}</span>
                <span className="font-bold">{v.letter}</span>
              </p>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-n10-border px-3 py-2 text-sm text-n10-soft">{summary.unlockLine}</p>
        )}
      </div>
      {children && <div className="mt-4 no-print">{children}</div>}
    </section>
  )
}

import { Link } from 'react-router-dom'
import { rubric } from '@/lib/rubric'

export function KnowledgePage() {
  const links = rubric.source_linkouts ?? []
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase text-n10-lime">LO206 Junior · Mosport / MIKA → BSC</p>
        <h1 className="text-3xl font-black mt-1">Knowledge</h1>
        <p className="mt-2 text-base text-n10-soft max-w-2xl">
          LO206 notes for drivers and tuners. Momentum class. Protect exit RPM ~5800–6100. Junior yellow slide: gear for restricted peak,
          not limiter. Setup hypotheses stay tagged — never “try harder” for a gearing problem.
        </p>
      </div>

      <section className="panel">
        <h2 className="text-xl font-bold">Home track</h2>
        <p className="mt-2 text-base text-n10-soft">
          {rubric.home_track?.name} · {rubric.home_track?.location} · {rubric.home_track?.club}
        </p>
        <p className="mt-2 text-sm text-n10-mute">
          Bias dims: {(rubric.home_track?.circuit_notes?.coaching_bias_dimension_ids ?? []).join(', ')}.
          No fabricated corner GPS in coaching copy.
        </p>
      </section>

      <section className="panel">
        <h2 className="text-xl font-bold">Class</h2>
        <p className="mt-2 text-base text-n10-soft">
          {rubric.confirmed_class?.name} · {rubric.confirmed_class?.slide}
        </p>
        <ul className="mt-2 list-disc pl-5 text-sm text-n10-soft space-y-1">
          {(rubric.confirmed_class?.coaching_overlays ?? []).map((o: string) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2 className="text-xl font-bold">Source linkouts</h2>
        <ul className="mt-3 space-y-2">
          {links.map((l: { id?: string; title?: string; label?: string; url: string }, i: number) => (
            <li key={i}>
              <a
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="text-n10-lime underline underline-offset-2"
              >
                {l.title ?? l.label ?? l.id ?? l.url}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-n10-mute">
        Rubric schema {rubric.schema_version} · baked from briggs-coach-api
      </p>
      <Link to="/" className="btn-secondary inline-flex">
        ← Home
      </Link>
    </div>
  )
}

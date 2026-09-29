import { Link } from 'react-router-dom'
import { rubric } from '@/lib/rubric'

export function DrillsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase text-n10-lime">One change rule</p>
        <h1 className="text-3xl font-black mt-1">Drills</h1>
        <p className="mt-2 text-base text-n10-soft max-w-2xl">
          Driver drills for the LO206. The coach picks <strong className="text-white">one</strong>{' '}
          primary drill from your weakest skill in the session. Keep it until that skill scores 4 out of 5 or better.
        </p>
      </div>
      <ul className="space-y-3">
        {rubric.drills.map((d) => (
          <li key={d.id} className="panel">
            <h2 className="text-xl font-bold">{d.name}</h2>
            <p className="mt-2 text-base text-n10-soft">{d.instruction}</p>
            {d.source && (
              <p className="mt-2 text-xs text-n10-mute">Source: {d.source}</p>
            )}
          </li>
        ))}
      </ul>
      <Link to="/" className="btn-secondary inline-flex">
        ← Home
      </Link>
    </div>
  )
}

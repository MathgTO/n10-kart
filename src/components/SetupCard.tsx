import { Link } from 'react-router-dom'
import { VoicePlayer } from './VoicePlayer'
import type { SetupVerdict } from '@/lib/setupVerdict'

/** Teal tuner card — one setup category per outing, from the setup verdict. */
export function SetupCard({
  verdict,
  sessionId,
  confirmed,
  kid,
  showTunerVoice,
}: {
  verdict: SetupVerdict
  sessionId: string
  confirmed: boolean
  kid: boolean
  /** Coach view / explicit request — never on Driver view by default. */
  showTunerVoice?: boolean
}) {
  return (
    <section className="rounded-2xl border border-n10-teal/40 bg-n10-teal/5 p-4 sm:p-5 print-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold uppercase tracking-wide text-n10-teal">⚙ Setup · Tuner</p>
        <Link to={`/session/${sessionId}/setup`} className="btn-secondary min-h-[44px] no-print">
          Edit setup
        </Link>
      </div>
      {!confirmed && (
        <p className="mt-2 rounded-lg border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
          Setup not confirmed yet — numbers below use the last known setup.{' '}
          <Link to={`/session/${sessionId}/setup`} className="font-semibold underline">
            Confirm setup
          </Link>
        </p>
      )}
      <div className="mt-3 space-y-2 text-base">
        {verdict.priorChange && (
          <p>
            <span className="font-semibold text-n10-teal">Last change:</span> {verdict.priorChange.text}
            {verdict.priorChange.applied === true ? ', applied' : verdict.priorChange.applied === false ? ', not seen in the data' : ''}
            {verdict.priorChange.evidence ? ` (${verdict.priorChange.evidence})` : ''}
          </p>
        )}
        <p>
          <span className="font-semibold text-n10-teal">This outing:</span> <span className="font-bold text-white">{verdict.categoryLabel}</span>
          {verdict.category !== 'none' ? ` — ${verdict.action}` : ` — ${verdict.action}`}
        </p>
        <p className="text-n10-soft">Hold: {verdict.holdLabel}</p>
        {verdict.why && <p className="text-n10-soft">{verdict.why}</p>}
        {verdict.limiterLine && <p className="text-n10-soft">{verdict.limiterLine}</p>}
        {verdict.vsLast && (
          <p className="text-n10-soft">
            vs {verdict.vsLast.prevDate}: {verdict.vsLast.deltaMs >= 0 ? '+' : '−'}
            {(Math.abs(verdict.vsLast.deltaMs) / 1000).toFixed(3)} s
          </p>
        )}
        {verdict.weatherLine && <p className="text-n10-soft">{verdict.weatherLine}</p>}
        <p className="text-sm text-n10-mute">
          {verdict.classLine} · {verdict.gpsOnly ? 'GPS speed only' : 'wheel speed'} · {verdict.confidence} confidence
        </p>
        {verdict.blanks.length > 0 && <p className="text-sm text-n10-mute">Missing: {verdict.blanks.join(' · ')}</p>}
        <p className="text-sm text-n10-mute">{verdict.preCheck}</p>
      </div>
      {showTunerVoice && (
        <div className="mt-3 no-print">
          <VoicePlayer label="Voice for tuner" script={verdict.voiceScript} tone="teal" />
        </div>
      )}
    </section>
  )
}

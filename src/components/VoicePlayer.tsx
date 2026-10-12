import { useEffect, useRef, useState } from 'react'

/**
 * On-device voice (Web Speech API). Same words as the card it came from — nothing is sent anywhere.
 * Falls back to "Show words" when the browser has no speech synthesis.
 */
export function VoicePlayer({ label, script, tone }: { label: string; script: string; tone: 'lime' | 'teal' }) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'
  const [state, setState] = useState<'idle' | 'playing' | 'paused'>('idle')
  const [rate, setRate] = useState(1)
  const [showWords, setShowWords] = useState(!supported)
  const uRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => () => {
    if (supported && uRef.current) window.speechSynthesis.cancel()
  }, [supported])

  const play = () => {
    if (!supported) {
      setShowWords(true)
      return
    }
    const synth = window.speechSynthesis
    if (state === 'paused') {
      synth.resume()
      setState('playing')
      return
    }
    synth.cancel()
    const u = new SpeechSynthesisUtterance(script)
    u.rate = rate
    u.lang = 'en-CA'
    const voices = synth.getVoices()
    const v = voices.find((x) => /en[-_](CA|US|GB)/i.test(x.lang) && /natural|premium|enhanced|samantha|google/i.test(x.name)) ?? voices.find((x) => /^en/i.test(x.lang))
    if (v) u.voice = v
    u.onend = () => setState('idle')
    u.onerror = () => setState('idle')
    uRef.current = u
    synth.speak(u)
    setState('playing')
  }
  const pause = () => {
    if (!supported) return
    window.speechSynthesis.pause()
    setState('paused')
  }
  const stop = () => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setState('idle')
  }
  const btn =
    tone === 'lime'
      ? 'bg-n10-lime text-black'
      : 'bg-n10-teal text-black'

  return (
    <div className="rounded-xl border border-n10-border bg-n10-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`min-h-[48px] flex-1 rounded-xl px-4 font-bold ${btn}`}
          onClick={state === 'playing' ? pause : play}
          aria-label={state === 'playing' ? `Pause ${label}` : `Play ${label}`}
        >
          {state === 'playing' ? '❚❚ Pause' : state === 'paused' ? '▶ Resume' : `▶ ${label}`}
        </button>
        {state !== 'idle' && (
          <button type="button" className="btn-secondary min-h-[48px]" onClick={stop}>
            Stop
          </button>
        )}
        <button
          type="button"
          className="btn-secondary min-h-[48px] min-w-[64px]"
          onClick={() => setRate((r) => (r === 1 ? 1.25 : 1))}
          aria-label="Playback speed"
          disabled={!supported}
        >
          {rate === 1 ? '1×' : '1.25×'}
        </button>
        <button type="button" className="btn-secondary min-h-[48px]" onClick={() => setShowWords((v) => !v)} aria-expanded={showWords}>
          {showWords ? 'Hide words' : 'Show words'}
        </button>
      </div>
      {!supported && <p className="mt-2 text-sm text-n10-mute">Voice isn’t available in this browser — here are the words.</p>}
      {showWords && <p className="mt-3 text-base leading-relaxed text-n10-soft">{script}</p>}
    </div>
  )
}

/**
 * In-browser AiM Race Studio .xrk / .xrz parser (subset).
 * Extracts LAP times, GPS speed (from NAV-SOL ECEF velocity), and RPM channel samples.
 * Format notes: libxrk / AIM XRK self-framing messages (<h…> headers, (S)/(G)/(M) data).
 */
import type { LapData, ParseResult, TelemetrySample } from './types'
import { synthLap, withDistanceFromSpeed } from './telemetry'

function zstr(bytes: Uint8Array): string {
  let end = bytes.length
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0) {
      end = i
      break
    }
  }
  return new TextDecoder('ascii').decode(bytes.subarray(0, end))
}

function u16(v: DataView, o: number) {
  return v.getUint16(o, true)
}
function u32(v: DataView, o: number) {
  return v.getUint32(o, true)
}
function i32(v: DataView, o: number) {
  return v.getInt32(o, true)
}

interface ChDef {
  index: number
  decoder: number
  short: string
  long: string
  periodUs: number
  size: number
}

interface LapMark {
  num: number
  duration: number
  endAbs: number
}

async function maybeInflateXrz(buf: ArrayBuffer): Promise<Uint8Array> {
  const u8 = new Uint8Array(buf)
  // zlib magic 78 01 / 78 9C / 78 DA
  if (u8.length >= 2 && u8[0] === 0x78 && (u8[1] === 0x01 || u8[1] === 0x9c || u8[1] === 0xda)) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const DS = (globalThis as any).DecompressionStream
      if (DS) {
        const stream = new Blob([u8]).stream().pipeThrough(new DS('deflate'))
        const ab = await new Response(stream).arrayBuffer()
        return new Uint8Array(ab)
      }
    } catch {
      /* fall through */
    }
    throw new Error('Compressed .xrz needs a modern browser (DecompressionStream). Try .xrk instead.')
  }
  return u8
}

function decodeSample(dec: number, size: number, view: DataView, offset: number): number {
  if (dec === 6 && size >= 4) return view.getFloat32(offset, true)
  if ((dec === 1 || dec === 20) && size >= 2) {
    const u = view.getUint16(offset, true)
    const sign = (u >> 15) & 1
    const exp = (u >> 10) & 0x1f
    const mant = u & 0x3ff
    let val: number
    if (exp === 0) val = mant ? (mant / 1024) * Math.pow(2, -14) : 0
    else if (exp === 31) val = Number.NaN
    else val = (1 + mant / 1024) * Math.pow(2, exp - 15)
    return sign ? -val : val
  }
  if ((dec === 4 || dec === 11) && size >= 2) return view.getInt16(offset, true)
  if (size >= 4) return view.getInt32(offset, true)
  if (size >= 2) return view.getInt16(offset, true)
  return view.getUint8(offset)
}

function nearestValue(
  samples: { t: number; v: number }[],
  t: number,
  fallback: number
): number {
  if (!samples.length) return fallback
  // binary search
  let lo = 0
  let hi = samples.length - 1
  if (t <= samples[0].t) return samples[0].v
  if (t >= samples[hi].t) return samples[hi].v
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (samples[mid].t <= t) lo = mid
    else hi = mid
  }
  const a = samples[lo]
  const b = samples[hi]
  if (t - a.t <= b.t - t) return a.v
  return b.v
}

export async function parseXrkFile(file: File, buf: ArrayBuffer): Promise<ParseResult> {
  const name = file.name
  const kind: 'xrk' | 'xrz' = name.toLowerCase().endsWith('.xrz') ? 'xrz' : 'xrk'
  let bytes: Uint8Array
  try {
    bytes = await maybeInflateXrz(buf)
  } catch (e) {
    return {
      ok: false,
      kind,
      laps: [],
      channels: { speed: false, rpm: false, lapTimes: false },
      message: e instanceof Error ? e.message : 'Could not decompress .xrz',
      fileName: name,
    }
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const n = bytes.length
  const chs = new Map<number, ChDef>()
  const grps = new Map<number, number[]>()
  const laps: LapMark[] = []
  const gps: { t: number; v: number }[] = []

  // Scan all <h…> headers (including nested in CNF)
  let i = 0
  while (i < n - 12) {
    if (bytes[i] !== 0x3c || bytes[i + 1] !== 0x68) {
      i++
      continue
    }
    const token = zstr(bytes.subarray(i + 2, i + 6))
    const plen = i32(view, i + 6)
    if (plen < 0 || i + 12 + plen + 8 > n || bytes[i + 11] !== 0x3e) {
      i++
      continue
    }
    const payOff = i + 12
    const foot = payOff + plen
    if (bytes[foot] !== 0x3c) {
      i++
      continue
    }

    if (token === 'CHS' && plen >= 112) {
      const idx = u16(view, payOff)
      chs.set(idx, {
        index: idx,
        decoder: bytes[payOff + 20],
        short: zstr(bytes.subarray(payOff + 24, payOff + 32)),
        long: zstr(bytes.subarray(payOff + 32, payOff + 56)),
        periodUs: u32(view, payOff + 64),
        size: bytes[payOff + 72],
      })
    } else if (token === 'GRP' && plen >= 4) {
      const gidx = u16(view, payOff)
      const count = u16(view, payOff + 2)
      if (4 + 2 * count <= plen) {
        const idxs: number[] = []
        for (let k = 0; k < count; k++) idxs.push(u16(view, payOff + 4 + 2 * k))
        grps.set(gidx, idxs)
      }
    } else if (token === 'LAP' && plen >= 20) {
      laps.push({
        num: u16(view, payOff + 2),
        duration: u32(view, payOff + 4),
        endAbs: u32(view, payOff + 16),
      })
    } else if ((token === 'GPS' || token === 'GPS1') && plen >= 56) {
      const tc = i32(view, payOff)
      const vx = i32(view, payOff + 32)
      const vy = i32(view, payOff + 36)
      const vz = i32(view, payOff + 40)
      const speedMs = Math.sqrt(vx * vx + vy * vy + vz * vz) / 100
      gps.push({ t: tc, v: speedMs })
    }
    i++
  }

  if (!laps.length) {
    return {
      ok: false,
      kind,
      laps: [],
      channels: { speed: false, rpm: false, lapTimes: false },
      message: `No lap markers found in ${name}.`,
      fileName: name,
    }
  }

  const channelSizes = new Map<number, number>()
  for (const c of chs.values()) channelSizes.set(c.index, c.size)
  const groupSizes = new Map<number, number>()
  for (const [g, idxs] of grps) {
    groupSizes.set(
      g,
      idxs.reduce((s, ci) => s + (channelSizes.get(ci) ?? 0), 0)
    )
  }

  const rpmCh =
    [...chs.values()].find((c) => {
      const nml = `${c.long} ${c.short}`.toLowerCase()
      return nml.includes('rpm') && !nml.includes('jack')
    }) ?? null

  const rpm: { t: number; v: number }[] = []
  if (rpmCh) {
    i = 0
    while (i < n - 8) {
      const b0 = bytes[i]
      const b1 = bytes[i + 1]
      if (b0 === 0x28 && b1 === 0x53) {
        // (S
        const tc = i32(view, i + 2)
        const cidx = u16(view, i + 6)
        const sz = channelSizes.get(cidx)
        if (sz == null) {
          i++
          continue
        }
        const end = i + 8 + sz
        if (end >= n || bytes[end] !== 0x29) {
          i++
          continue
        }
        if (cidx === rpmCh.index) {
          rpm.push({ t: tc, v: decodeSample(rpmCh.decoder, sz, view, i + 8) })
        }
        i = end + 1
      } else if (b0 === 0x28 && b1 === 0x47) {
        // (G
        const tc = i32(view, i + 2)
        const gidx = u16(view, i + 6)
        const sz = groupSizes.get(gidx)
        if (sz == null) {
          i++
          continue
        }
        const end = i + 8 + sz
        if (end >= n || bytes[end] !== 0x29) {
          i++
          continue
        }
        const members = grps.get(gidx)
        if (members && members.includes(rpmCh.index)) {
          let off = 0
          for (const ci of members) {
            const csz = channelSizes.get(ci) ?? 0
            if (ci === rpmCh.index && csz > 0) {
              rpm.push({ t: tc, v: decodeSample(rpmCh.decoder, csz, view, i + 8 + off) })
            }
            off += csz
          }
        }
        i = end + 1
      } else if (b0 === 0x28 && b1 === 0x4d) {
        // (M
        const tc = i32(view, i + 2)
        const cidx = u16(view, i + 6)
        const count = u16(view, i + 8)
        const sz = channelSizes.get(cidx)
        if (sz == null || count > 20000) {
          i++
          continue
        }
        const end = i + 10 + sz * count
        if (end >= n || bytes[end] !== 0x29) {
          i++
          continue
        }
        if (cidx === rpmCh.index) {
          const periodMs = Math.max(1, Math.floor(rpmCh.periodUs / 1000))
          for (let k = 0; k < count; k++) {
            rpm.push({
              t: tc + k * periodMs,
              v: decodeSample(rpmCh.decoder, sz, view, i + 10 + k * sz),
            })
          }
        }
        i = end + 1
      } else {
        i++
      }
    }
  }

  laps.sort((a, b) => a.num - b.num)
  const t0 = laps[0].endAbs - laps[0].duration

  const gpsRel = gps
    .map((s) => ({ t: s.t - t0, v: s.v }))
    .filter((s) => s.t >= -1000)
    .sort((a, b) => a.t - b.t)
  const rpmRel = rpm
    .map((s) => ({ t: s.t - t0, v: s.v }))
    .filter((s) => s.t >= -1000)
    .sort((a, b) => a.t - b.t)

  const hasSpeed = gpsRel.length > 50
  const hasRpm = rpmRel.length > 50

  // Cumulative session timeline from durations (matches Race Studio lap windows)
  let cursor = 0
  const built: LapData[] = []
  for (let li = 0; li < laps.length; li++) {
    const mark = laps[li]
    const timeMs = mark.duration
    if (timeMs < 1000) {
      cursor += timeMs
      continue
    }
    const start = cursor
    const end = cursor + timeMs
    cursor = end

    if (hasSpeed || hasRpm) {
      const nPts = Math.min(240, Math.max(80, Math.round(timeMs / 300)))
      const samples: TelemetrySample[] = []
      for (let p = 0; p <= nPts; p++) {
        const u = p / nPts
        const tMs = start + u * timeMs
        const speedMs = hasSpeed ? nearestValue(gpsRel, tMs, 0) : 0
        const speed = speedMs * 3.6 // m/s → km/h
        const rpmV = hasRpm ? nearestValue(rpmRel, tMs, 5000) : 5000
        samples.push({
          t: (u * timeMs) / 1000,
          dist: u,
          speed,
          rpm: rpmV,
        })
      }
      const speeds = samples.map((s) => s.speed)
      const rpms = samples.map((s) => s.rpm)
      built.push({
        index: built.length,
        lapNumber: mark.num,
        timeMs,
        // Samples are evenly spaced in time; give them a real distance axis from GPS speed
        samples: hasSpeed ? withDistanceFromSpeed(samples) : samples,
        minSpeed: Math.min(...speeds),
        maxSpeed: Math.max(...speeds),
        maxRpm: Math.max(...rpms),
        exitRpmFocus: samples[Math.floor(samples.length * 0.35)]?.rpm,
      })
    } else {
      const lap = synthLap(timeMs, li + 1)
      lap.index = built.length
      lap.lapNumber = mark.num
      built.push(lap)
    }
  }

  if (!built.length) {
    return {
      ok: false,
      kind,
      laps: [],
      channels: { speed: hasSpeed, rpm: hasRpm, lapTimes: true },
      message: `Found lap markers in ${name} but could not build lap data.`,
      fileName: name,
    }
  }

  const flying = built.map((l) => l.timeMs).filter((t) => t >= 45000 && t <= 180000)
  const best = Math.min(...(flying.length ? flying : built.map((l) => l.timeMs)))
  return {
    ok: true,
    kind,
    laps: built,
    channels: { speed: hasSpeed, rpm: hasRpm, lapTimes: true },
    message: `Parsed ${built.length} laps from ${kind.toUpperCase()} · best ${(best / 1000).toFixed(3)}s · GPS ${hasSpeed ? 'yes' : 'no'} · RPM ${hasRpm ? 'yes' : 'no'}.`,
    fileName: name,
  }
}

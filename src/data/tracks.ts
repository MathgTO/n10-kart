import type { TrackInfo, TrackLayoutInfo } from '@/lib/types'
import { sectorTrackCorners } from './mosportSectors'
import { GP_MEASURED_M } from '@/lib/mosportLayouts'

/**
 * Track table: the single place a venue's coordinates and IANA time zone live.
 * Coordinates per /workspace/uiex-n10/track-autodetect.md §4 (Mosport from 5 real GPS sessions;
 * Hamilton / TMP / Goodwood from public listings + OSM, medium confidence until a real session refines them).
 * Venues without verified coordinates carry only a zone; detection then falls back to the TRK name.
 */

/** Mosport GP sector markers (S1–S4). Same split used for coaching loss until layout-specific tables land. */
const mosportCorners = sectorTrackCorners().map(({ name, sectorFrac }) => ({ name, sectorFrac }))

const MOSPORT_LAYOUTS: TrackLayoutInfo[] = [
  { id: 'gp', name: 'GP', lengthM: GP_MEASURED_M, direction: 'ccw', measured: true },
  { id: 'national', name: 'National', lengthM: 1210, direction: 'ccw' },
  { id: 'club', name: 'Club', lengthM: 1050, direction: 'ccw' },
  { id: 'short', name: 'Short', lengthM: 920, direction: 'ccw' },
  { id: 'reverse', name: 'GP reverse', lengthM: GP_MEASURED_M, direction: 'cw' },
]

const ONT = 'America/Toronto'

export const TRACKS: TrackInfo[] = [
  {
    id: 'mosport',
    name: 'Mosport Karting Centre',
    short: 'Mosport',
    region: 'Ontario',
    location: 'Bowmanville',
    ontario: true,
    home: true,
    corners: mosportCorners,
    lat: 44.05327,
    lon: -78.68165,
    radiusM: 500,
    tz: ONT,
    aliases: ['Mosport', 'Mosport Karting', 'Mosport Kart Centre'],
    aimNames: ['Mosport Karting Center'],
    sf: [
      { lat: 44.0538398, lon: -78.6812007 },
      { lat: 44.0536561, lon: -78.6816096 },
    ],
    layouts: MOSPORT_LAYOUTS,
    coordConfidence: 'high',
  },
  {
    id: 'goodwood',
    name: 'Goodwood Kartways',
    short: 'Goodwood',
    region: 'Ontario',
    location: 'Uxbridge',
    ontario: true,
    corners: mosportCorners,
    lat: 44.0476241,
    lon: -79.2287394,
    radiusM: 600,
    tz: ONT,
    aliases: ['Goodwood', 'Goodwood Kartway'],
    layouts: [{ id: 'main', name: 'Main', lengthM: 1000, direction: 'ccw' }],
    coordConfidence: 'medium',
  },
  {
    id: 'brechin',
    name: 'Brechin Motorsport Park',
    short: 'Brechin',
    region: 'Ontario',
    location: 'Brechin',
    ontario: true,
    corners: mosportCorners,
    tz: ONT,
    aliases: ['Brechin'],
  },
  {
    id: 'hamilton',
    name: 'Hamilton Karting Complex',
    short: 'Hamilton',
    region: 'Ontario',
    location: 'Mount Hope',
    ontario: true,
    corners: mosportCorners,
    lat: 43.17094,
    lon: -79.90679,
    radiusM: 600,
    tz: ONT,
    aliases: ['Hamilton Kart Club', 'Canadian Mini Indy', 'Hamilton Karting'],
    layouts: [{ id: 'main', name: 'Main', lengthM: 1100, direction: 'ccw' }],
    coordConfidence: 'medium',
  },
  {
    id: 'tmp',
    name: 'Toronto Motorsports Park',
    short: 'TMP',
    region: 'Ontario',
    location: 'Cayuga',
    ontario: true,
    corners: mosportCorners,
    lat: 42.8987252,
    lon: -79.8561397,
    radiusM: 1200,
    tz: ONT,
    aliases: ['TMP', 'Toronto Motorsport Park', 'Cayuga'],
    layouts: [{ id: 'event', name: 'Event layout', lengthM: 1000, direction: 'ccw' }],
    coordConfidence: 'medium',
  },
  {
    id: 'shenington',
    name: 'Shenington Kart Racing Club',
    short: 'Shenington',
    region: 'UK',
    location: 'Oxfordshire',
    corners: mosportCorners,
    tz: 'Europe/London',
    aliases: ['Shenington'],
  },
  {
    id: 'pf',
    name: 'PF International',
    short: 'PF International',
    region: 'UK',
    location: 'Lincolnshire',
    corners: mosportCorners,
    tz: 'Europe/London',
    aliases: ['PFi', 'PF Intl'],
  },
  {
    id: 'roadamerica',
    name: 'Briggs & Stratton Motorplex',
    short: 'Motorplex',
    region: 'USA',
    location: 'Road America, WI',
    corners: mosportCorners,
    tz: 'America/Chicago',
    aliases: ['Road America Motorplex'],
  },
  {
    id: 'goodyear',
    name: 'Goodyear Karting',
    short: 'Goodyear',
    region: 'USA',
    location: 'Arizona',
    corners: mosportCorners,
    tz: 'America/Phoenix',
    aliases: ['Goodyear'],
  },
  {
    id: 'other',
    name: 'Other / Away round',
    short: 'Other track',
    region: 'Other',
    location: '',
    corners: mosportCorners,
  },
]

const CUSTOM_KEY = 'n10-kart-custom-tracks-v1'

/** User-created tracks ("New track" from a GPS centroid), kept on this device. */
export function loadCustomTracks(): TrackInfo[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(CUSTOM_KEY) : null
    return raw ? (JSON.parse(raw) as TrackInfo[]) : []
  } catch {
    return []
  }
}

export function saveCustomTrack(t: TrackInfo): void {
  try {
    const list = loadCustomTracks().filter((x) => x.id !== t.id)
    localStorage.setItem(CUSTOM_KEY, JSON.stringify([...list, t]))
  } catch {
    /* storage full / unavailable */
  }
}

export function allTracks(): TrackInfo[] {
  return [...TRACKS.filter((t) => t.id !== 'other'), ...loadCustomTracks(), TRACKS[TRACKS.length - 1]]
}

export function getTrack(id: string | undefined | null): TrackInfo {
  return allTracks().find((t) => t.id === id) ?? TRACKS[0]
}

export function getLayoutInfo(track: TrackInfo, layoutId?: string | null): TrackLayoutInfo | undefined {
  return track.layouts?.find((l) => l.id === layoutId) ?? track.layouts?.[0]
}

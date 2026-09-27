import type { TrackInfo } from '@/lib/types'
import { sectorTrackCorners } from './mosportSectors'

/** Mosport GP sector markers (S1–S4). Same split used for coaching loss until layout-specific tables land. */
const mosportCorners = sectorTrackCorners().map(({ name, sectorFrac }) => ({ name, sectorFrac }))

export const TRACKS: TrackInfo[] = [
  {
    id: 'mosport',
    name: 'Mosport Karting Centre',
    region: 'Ontario',
    location: 'Bowmanville',
    ontario: true,
    home: true,
    corners: mosportCorners,
  },
  {
    id: 'goodwood',
    name: 'Goodwood Kartways',
    region: 'Ontario',
    location: 'Uxbridge',
    ontario: true,
    corners: mosportCorners,
  },
  {
    id: 'brechin',
    name: 'Brechin Motorsport Park',
    region: 'Ontario',
    location: 'Brechin',
    ontario: true,
    corners: mosportCorners,
  },
  {
    id: 'hamilton',
    name: 'Hamilton Kart Club',
    region: 'Ontario',
    location: 'Hamilton',
    ontario: true,
    corners: mosportCorners,
  },
  {
    id: 'tmp',
    name: 'Toronto Motorsports Park',
    region: 'Ontario',
    location: 'Cayuga',
    ontario: true,
    corners: mosportCorners,
  },
  {
    id: 'shenington',
    name: 'Shenington Kart Racing Club',
    region: 'UK',
    location: 'Oxfordshire',
    corners: mosportCorners,
  },
  {
    id: 'pf',
    name: 'PF International',
    region: 'UK',
    location: 'Lincolnshire',
    corners: mosportCorners,
  },
  {
    id: 'roadamerica',
    name: 'Briggs & Stratton Motorplex',
    region: 'USA',
    location: 'Road America, WI',
    corners: mosportCorners,
  },
  {
    id: 'goodyear',
    name: 'Goodyear Karting',
    region: 'USA',
    location: 'Arizona',
    corners: mosportCorners,
  },
  {
    id: 'other',
    name: 'Other / Away round',
    region: 'Other',
    location: '',
    corners: mosportCorners,
  },
]

export function getTrack(id: string): TrackInfo {
  return TRACKS.find((t) => t.id === id) ?? TRACKS[0]
}

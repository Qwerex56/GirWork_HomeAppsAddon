import type { ShiftRequest } from '../api/types'
import { apiDateKey } from './dates'

// The API encodes a request type as a string:
//   "11111" full day, "00000" day off, "<HHMM" not before, ">HHMM" not after, "$HHMMHHMM" work hours.

export type RequestKind = 'FULL_DAY' | 'OFF_DAY' | 'WORK_HOURS' | 'NOT_BEFORE' | 'NOT_AFTER'

export const REQUEST_KINDS: Array<{ value: RequestKind; label: string }> = [
  { value: 'FULL_DAY', label: 'Dzień pracujący' },
  { value: 'OFF_DAY', label: 'Dzień wolny' },
  { value: 'WORK_HOURS', label: 'Godziny pracy' },
  { value: 'NOT_BEFORE', label: 'Nie pracuję przed godziną' },
  { value: 'NOT_AFTER', label: 'Nie pracuję po godzinie' },
]

export function kindNeedsTime(kind: RequestKind): boolean {
  return kind === 'WORK_HOURS' || kind === 'NOT_BEFORE' || kind === 'NOT_AFTER'
}

const compact = (time: string) => time.replace(':', '').padStart(4, '0')
const readable = (hhmm: string) => `${hhmm.slice(0, 2)}:${hhmm.slice(2, 4)}`

export function encodeRequest(kind: RequestKind, start: string, end: string): string {
  switch (kind) {
    case 'FULL_DAY': return '11111'
    case 'OFF_DAY': return '00000'
    case 'NOT_BEFORE': return `<${compact(start)}`
    case 'NOT_AFTER': return `>${compact(end)}`
    case 'WORK_HOURS': return `$${compact(start)}${compact(end)}`
  }
}

export function decodeKind(code: string): RequestKind | null {
  if (code === '11111') return 'FULL_DAY'
  if (code === '00000') return 'OFF_DAY'
  if (code.startsWith('<')) return 'NOT_BEFORE'
  if (code.startsWith('>')) return 'NOT_AFTER'
  if (code.startsWith('$')) return 'WORK_HOURS'
  return null
}

export function describeRequest(code: string): string {
  switch (decodeKind(code)) {
    case 'FULL_DAY': return 'Cały dzień'
    case 'OFF_DAY': return 'Wolne'
    case 'NOT_BEFORE': return `Od ${readable(code.slice(1, 5))}`
    case 'NOT_AFTER': return `Do ${readable(code.slice(1, 5))}`
    case 'WORK_HOURS': return `${readable(code.slice(1, 5))}–${readable(code.slice(5, 9))}`
    default: return code
  }
}

/**
 * The API can return several requests for one day (e.g. after a double submit).
 * Keep only the newest per day, sorted by date, so lists never repeat a day.
 */
export function latestPerDay(requests: ShiftRequest[]): ShiftRequest[] {
  const byDay = new Map<string, ShiftRequest>()
  for (const request of requests) {
    const key = apiDateKey(request.BusinessDate)
    const current = byDay.get(key)
    if (!current || request.ShiftRequestDate > current.ShiftRequestDate) {
      byDay.set(key, request)
    }
  }
  return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, request]) => request)
}

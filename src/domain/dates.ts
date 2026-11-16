// All calendar logic works on local "YYYY-MM-DD" keys.
// Never use toISOString() for a day: it shifts to UTC and can land on the previous day.

export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// API dates look like "2026-10-14T00:00:00"; the first 10 chars are the business day.
export function apiDateKey(value: string): string {
  return value.slice(0, 10)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

export function startOfWeek(date: Date): Date {
  const mondayOffset = (date.getDay() + 6) % 7
  return addDays(date, -mondayOffset)
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export function daysOfMonth(month: Date): Date[] {
  const count = endOfMonth(month).getDate()
  return Array.from({ length: count }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))
}

/** Number of empty cells before day 1 in a Monday-first grid. */
export function leadingBlankDays(month: Date): number {
  return (startOfMonth(month).getDay() + 6) % 7
}

export type DateRange = { start: Date; end: Date }

/** Days the employee may still file or remove a request for. */
export function requestWindow(today = new Date()): DateRange {
  const start = addDays(startOfWeek(today), 15)
  return { start, end: addDays(start, 365) }
}

/** Requests are listed from one week before the window so recent ones stay visible. */
export function requestListWindow(today = new Date()): DateRange {
  const { start, end } = requestWindow(today)
  return { start: addDays(start, -7), end }
}

/** The week starting two Mondays from now, when the schedule is frozen. */
export function freezeWindow(today = new Date()): DateRange {
  const start = addDays(startOfWeek(today), 14)
  return { start, end: addDays(start, 6) }
}

export function isInRange(key: string, range: DateRange): boolean {
  return key >= toDateKey(range.start) && key <= toDateKey(range.end)
}

export function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('pl-PL')
}

export function formatLongDate(key: string): string {
  const text = fromDateKey(key).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatWeekdayShort(date: Date): string {
  return date.toLocaleDateString('pl-PL', { weekday: 'short' })
}

export function formatMonth(date: Date): string {
  return date.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
}

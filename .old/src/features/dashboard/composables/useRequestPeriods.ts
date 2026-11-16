export function getStartOfWeek(date: Date): Date {
  const start = new Date(date)
  const day = start.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diffToMonday)
  start.setHours(0, 0, 0, 0)
  return start
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function getRequestWindow(): { start: Date; end: Date } {
  const today = new Date()
  const currentWeekStart = getStartOfWeek(today)
  const start = addDays(currentWeekStart, 15)
  const end = addDays(start, 365)
  return { start, end }
}

export function getRequestDisplayWindow(): { start: Date; end: Date } {
  const { start, end } = getRequestWindow()
  const displayStart = new Date(start)
  displayStart.setDate(displayStart.getDate() - 7)
  return { start: displayStart, end }
}

export function isDateAllowedForRequest(dateValue: string): boolean {
  if (!dateValue) return false

  const requestDate = new Date(`${dateValue}T00:00:00`)
  const { start, end } = getRequestWindow()
  return requestDate >= start && requestDate <= end
}

export function filterVisibleRequests<T extends { BusinessDate: string }>(requests: T[]): T[] {
  return requests.filter((request) => {
    const date = request.BusinessDate.slice(0, 10)
    const requestDate = new Date(`${date}T00:00:00`)
    const { start, end } = getRequestDisplayWindow()
    return requestDate >= start && requestDate <= end
  })
}

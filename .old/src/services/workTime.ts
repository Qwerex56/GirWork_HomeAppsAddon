import type {
  AttendanceRecord,
  ExistingShiftRequest,
  ShiftDay,
  ShiftDetailDay,
  ShiftRequestPayload,
  ShiftRequestResult,
  ShiftRequestType,
  TokenResponse,
} from '../types'

export const HOURLY_RATE = 31.4

export function parseISODate(value: string): Date | null {
  if (!value) return null

  const direct = new Date(value)
  if (!Number.isNaN(direct.getTime())) return direct

  const normalized = value.replace('Z', '+00:00')
  const withTimezone = new Date(normalized)
  if (!Number.isNaN(withTimezone.getTime())) return withTimezone

  const fallback = new Date(value.replace(' ', 'T'))
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

export function getMonthInterval() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export function getWeekInterval() {
  const now = new Date()
  const day = now.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day

  const start = new Date(now)
  start.setDate(now.getDate() + diffToMonday)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

export function hoursFromSeconds(value: number): number {
  return value / 3600
}

export function hoursFromMilliseconds(value: number): number {
  return value / 1000 / 60 / 60
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    const decoded = atob(padded)
    return JSON.parse(decoded) as Record<string, unknown>
  } catch {
    return null
  }
}

export function extractEmployeeIdFromLoginData(data: unknown): number | null {
  const candidates: unknown[] = [
    data && typeof data === 'object' ? (data as Record<string, unknown>).employeeId : undefined,
    data && typeof data === 'object' ? (data as Record<string, unknown>).employee_id : undefined,
    data && typeof data === 'object' ? (data as Record<string, unknown>).EmployeeId : undefined,
    data && typeof data === 'object' ? (data as Record<string, unknown>).userId : undefined,
    data && typeof data === 'object' ? (data as Record<string, unknown>).user_id : undefined,
    data && typeof data === 'object' ? (data as Record<string, unknown>).id : undefined,
    data && typeof data === 'object' ? (data as Record<string, unknown>).user : undefined,
    data && typeof data === 'object' ? (data as Record<string, unknown>).employee : undefined,
  ]

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object') {
      const obj = candidate as Record<string, unknown>
      const nestedValues = [
        obj.employeeId,
        obj.employee_id,
        obj.EmployeeId,
        obj.id,
        obj.userId,
        obj.user_id,
      ]

      for (const nested of nestedValues) {
        const value = Number(nested)
        if (Number.isFinite(value) && value > 0) {
          return value
        }
      }
    }

    const directValue = Number(candidate)
    if (Number.isFinite(directValue) && directValue > 0) {
      return directValue
    }
  }

  if (data && typeof data === 'object') {
    const token = (data as Record<string, unknown>).access_token
    if (typeof token === 'string') {
      const claims = decodeJwtPayload(token)
      const claimNames = ['employeeId', 'EmployeeId', 'employee_id', 'sub', 'userId', 'user_id', 'id']

      for (const name of claimNames) {
        const claimed = claims?.[name]
        const value = Number(claimed)
        if (Number.isFinite(value) && value > 0) {
          return value
        }
      }
    }
  }

  return null
}

export async function requestToken(username: string, password: string): Promise<{ token: string; employeeId: number | null }> {
  const body = new URLSearchParams({
    grant_type: 'password',
    username,
    password,
    client_id: 'mobile',
    client_secret: 'secret',
    gir_client: 'girstaff',
  }).toString()

  const response = await fetch('https://gotogir.com/is/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Accept: 'application/json',
    },
    body,
  })

  if (!response.ok) {
    throw new Error(`Błąd logowania: ${response.status}`)
  }

  const data: TokenResponse & Record<string, unknown> = await response.json()
  if (!data.access_token) {
    throw new Error('Brak tokenu w odpowiedzi serwera.')
  }

  const employeeId = extractEmployeeIdFromLoginData(data)
  return { token: data.access_token, employeeId }
}

export async function fetchUserData(token: string): Promise<number | null> {
  const response = await fetch('https://v5api.workforce.mapal-os.com/v5/api/StaffInfo/UserData', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      lang: 'pl-PL',
    },
  })

  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as { Id?: number | string | null }
  const parsed = Number(data.Id)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export async function fetchShifts(token: string): Promise<ShiftDay[]> {
  const response = await fetch('https://v5api.workforce.mapal-os.com/v5/api/ShiftStaff/Shifts', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      lang: 'pl-PL',
    },
  })

  if (!response.ok) {
    throw new Error(`Błąd pobierania zmian: ${response.status}`)
  }

  return (await response.json()) as ShiftDay[]
}

export async function fetchAttendance(token: string, dateFrom = getMonthInterval().start): Promise<AttendanceRecord[]> {
  const normalizedStart = new Date(dateFrom)
  normalizedStart.setUTCHours(0, 30, 23, 324)

  const url = new URL('https://v5api.workforce.mapal-os.com/v5/api/TimeAttendance/AttendanceHistory')
  url.searchParams.set('dateFrom', normalizedStart.toISOString())

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      lang: 'pl-PL',
    },
  })

  if (!response.ok) {
    throw new Error(`Błąd pobierania obecności: ${response.status}`)
  }

  return (await response.json()) as AttendanceRecord[]
}

export function getCurrentMonthRequestWindow() {
  const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const end = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export async function fetchShiftRequests(token: string, dateFrom?: Date, dateTo?: Date): Promise<ExistingShiftRequest[]> {
  const monthRange = getCurrentMonthRequestWindow()
  const from = dateFrom ?? monthRange.start
  const to = dateTo ?? monthRange.end

  const url = new URL('https://v5api.workforce.mapal-os.com/v5/api/ShiftStaff/ShiftRequests')
  url.searchParams.set('dateFrom', from.toISOString())
  url.searchParams.set('dateTo', to.toISOString())

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      lang: 'pl-PL',
    },
  })

  if (!response.ok) {
    throw new Error(`Błąd pobierania wniosków: ${response.status}`)
  }

  return (await response.json()) as ExistingShiftRequest[]
}

function toSafeIsoDate(date: string): string {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T12:00:00` : date
  return new Date(normalized).toISOString()
}

export async function fetchColleaguesOnShift(token: string, date: string): Promise<ShiftDetailDay[]> {
  const url = new URL('https://v5api.workforce.mapal-os.com/v5/api/ShiftStaff/ColleaguesOnShift')
  url.searchParams.set('date', toSafeIsoDate(date))

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      lang: 'pl-PL',
    },
  })

  if (!response.ok) {
    return []
  }

  return (await response.json()) as ShiftDetailDay[]
}

export function describeShiftRequest(request: ExistingShiftRequest): string {
  const type = request.TypeOfRequest

  if (type === '11111') return 'Cały dzień'
  if (type === '00000') return 'Dzień wolny'
  if (type.startsWith('<')) return `Nie pracuję przed ${type.slice(1, 3)}:${type.slice(3, 5)}`
  if (type.startsWith('>')) return `Nie pracuję po ${type.slice(1, 3)}:${type.slice(3, 5)}`
  if (type.startsWith('$') && type.length >= 9) {
    const start = `${type.slice(1, 3)}:${type.slice(3, 5)}`
    const end = `${type.slice(5, 7)}:${type.slice(7, 9)}`
    return `${start}–${end}`
  }

  return type
}

function formatHHmm(value: string): string {
  const [hours, minutes] = value.split(':').map(Number)
  const result = `${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}`
  return result
}

export function buildShiftRequestPayload(
  employeeId: number,
  date: string,
  type: ShiftRequestType,
  startTime = '09:00',
  endTime = '18:00',
): ShiftRequestPayload {
  let typeOfRequest = '11111'

  switch (type) {
    case 'FULL_DAY':
      typeOfRequest = '11111'
      break
    case 'OFF_DAY':
      typeOfRequest = '00000'
      break
    case 'NOT_BEFORE':
      typeOfRequest = `<${formatHHmm(startTime)}`
      break
    case 'NOT_AFTER':
      typeOfRequest = `>${formatHHmm(endTime)}`
      break
    case 'WORK_HOURS':
      typeOfRequest = `$${formatHHmm(startTime)}${formatHHmm(endTime)}`
      break
    default:
      typeOfRequest = '11111'
      break
  }

  return {
    EmployeeId: employeeId,
    BusinessDate: toSafeIsoDate(date),
    TypeOfRequest: typeOfRequest,
    ShiftRequestDate: new Date().toISOString(),
    ReasonRequest: '',
    State: 0,
    IsScheduledShifts: false,
    IsNew: true,
  }
}

export async function submitShiftRequestSeries(
  token: string,
  requests: ShiftRequestPayload[],
): Promise<ShiftRequestResult[]> {
  const results: ShiftRequestResult[] = []

  for (const request of requests) {
    try {
      const response = await fetch(
        'https://v5api.workforce.mapal-os.com/v5/api/ShiftStaff/NewShiftRequest',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            lang: 'pl-PL',
          },
          body: JSON.stringify(request),
        },
      )

      const responseText = await response.text()
      const success = response.ok && responseText.trim().length > 0

      results.push({
        date: request.BusinessDate,
        success,
        message: success ? 'Wniosek wysłany poprawnie.' : `Błąd: ${response.status} ${responseText || ''}`,
      })
    } catch (error) {
      results.push({
        date: request.BusinessDate,
        success: false,
        message: error instanceof Error ? error.message : 'Nieznany błąd.',
      })
    }
  }

  return results
}

export async function removeShiftRequest(token: string, date: string): Promise<boolean> {
  const url = new URL('https://v5api.workforce.mapal-os.com/v5/api/ShiftStaff/RemoveShiftRequest')
  url.searchParams.set('date', toSafeIsoDate(date))

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      lang: 'pl-PL',
    },
  })

  if (!response.ok) {
    return false
  }

  const text = await response.text()
  return text.toLowerCase() === 'true'
}

import type { AttendanceRecord, ShiftDay, ShiftDetail, ShiftRequest } from './types'

const TOKEN_URL = 'https://gotogir.com/is/connect/token'
const API_URL = 'https://v5api.workforce.mapal-os.com/v5/api'

export class UnauthorizedError extends Error {
  constructor() {
    super('Sesja wygasła. Zaloguj się ponownie.')
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'DELETE'
  query?: Record<string, string>
  body?: unknown
}

async function call(token: string, path: string, options: RequestOptions = {}): Promise<Response> {
  const url = new URL(`${API_URL}/${path}`)
  for (const [key, value] of Object.entries(options.query ?? {})) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      lang: 'pl-PL',
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (response.status === 401) throw new UnauthorizedError()
  return response
}

async function callJson<T>(token: string, path: string, options?: RequestOptions): Promise<T> {
  const response = await call(token, path, options)
  if (!response.ok) throw new Error(`Błąd serwera (${response.status}) przy ${path}`)
  return (await response.json()) as T
}

export async function login(username: string, password: string): Promise<string> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username,
      password,
      client_id: 'mobile',
      client_secret: 'secret',
      gir_client: 'girstaff',
    }),
  })

  if (!response.ok) throw new Error(`Błąd logowania (${response.status})`)

  const data = (await response.json()) as { access_token?: string }
  if (!data.access_token) throw new Error('Brak tokenu w odpowiedzi serwera.')
  return data.access_token
}

export async function fetchEmployeeId(token: string): Promise<number | null> {
  const data = await callJson<{ Id?: number | string | null }>(token, 'StaffInfo/UserData', { method: 'POST' })
  const id = Number(data.Id)
  return Number.isFinite(id) && id > 0 ? id : null
}

export function fetchShifts(token: string): Promise<ShiftDay[]> {
  return callJson(token, 'ShiftStaff/Shifts')
}

export function fetchAttendance(token: string, from: Date): Promise<AttendanceRecord[]> {
  return callJson(token, 'TimeAttendance/AttendanceHistory', {
    query: { dateFrom: from.toISOString() },
  })
}

export function fetchShiftRequests(token: string, from: Date, to: Date): Promise<ShiftRequest[]> {
  return callJson(token, 'ShiftStaff/ShiftRequests', {
    query: { dateFrom: from.toISOString(), dateTo: to.toISOString() },
  })
}

export function fetchColleaguesOnShift(token: string, dateKey: string): Promise<ShiftDetail[]> {
  return callJson(token, 'ShiftStaff/ColleaguesOnShift', {
    query: { date: middayIso(dateKey) },
  })
}

export async function sendShiftRequest(
  token: string,
  employeeId: number,
  dateKey: string,
  code: string,
): Promise<void> {
  const body: ShiftRequest = {
    EmployeeId: employeeId,
    BusinessDate: middayIso(dateKey),
    TypeOfRequest: code,
    ShiftRequestDate: new Date().toISOString(),
    ReasonRequest: '',
    State: 0,
    IsScheduledShifts: false,
    IsNew: true,
  }

  const response = await call(token, 'ShiftStaff/NewShiftRequest', { method: 'POST', body })
  const text = await response.text()
  if (!response.ok || !text.trim()) {
    throw new Error(`Błąd ${response.status} ${text}`.trim())
  }
}

export async function removeShiftRequest(token: string, dateKey: string): Promise<boolean> {
  const response = await call(token, 'ShiftStaff/RemoveShiftRequest', {
    method: 'DELETE',
    query: { date: middayIso(dateKey) },
  })
  return response.ok && (await response.text()).toLowerCase() === 'true'
}

// Midday local time keeps the date the same after conversion to UTC.
function middayIso(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toISOString()
}

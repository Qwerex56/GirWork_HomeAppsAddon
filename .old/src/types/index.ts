export type TokenResponse = {
  access_token: string
  refresh_token?: string | null
  expires_in?: number | null
  token_type?: string | null
}

export type Shift = {
  StartDate: string
  EndDate: string
  UnitDescription?: string | null
  UnitId?: number | null
  JobDescription?: string | null
  JobAbbr?: string | null
}

export type ColleagueOnShift = {
  Id: number
  Name?: string | null
  Surname?: string | null
  ShiftStart?: string | null
  ShiftEnd?: string | null
  Image?: string | null
}

export type ShiftDay = {
  BusinessDate: string
  Shifts: Shift[]
}

export type ShiftDetailDay = {
  Id: number
  StartDate: string
  EndDate: string
  UnitId: number
  UnitDescription: string
  Colleagues: ColleagueOnShift[]
}

export type AttendanceRecord = {
  BusinessDate: string
  NetComputableTime?: number | null
}

export type DashboardState = {
  monthActualHours: number
  monthPredictedHours: number
  weekActualHours: number
  weekPredictedHours: number
  lastUpdatedText: string
}

export type ShiftRequestType =
  | 'FULL_DAY'
  | 'OFF_DAY'
  | 'NOT_BEFORE'
  | 'NOT_AFTER'
  | 'WORK_HOURS'

export type ShiftRequestPayload = {
  EmployeeId: number
  BusinessDate: string
  TypeOfRequest: string
  ShiftRequestDate: string
  ReasonRequest: string
  State: number
  IsScheduledShifts: boolean
  IsNew: boolean
}

export type ShiftRequestResult = {
  date: string
  success: boolean
  message: string
}

export type ExistingShiftRequest = {
  EmployeeId: number
  BusinessDate: string
  TypeOfRequest: string
  ShiftRequestDate: string
  ReasonRequest: string
  State: number
  IsScheduledShifts: boolean
  IsNew: boolean
}

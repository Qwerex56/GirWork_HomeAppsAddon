// Shapes returned by the GIR / Mapal API. Field names match the server.

export type Shift = {
  StartDate: string
  EndDate: string
  UnitDescription?: string | null
  JobDescription?: string | null
  JobAbbr?: string | null
}

export type ShiftDay = {
  BusinessDate: string
  Shifts: Shift[]
}

export type AttendanceRecord = {
  BusinessDate: string
  NetComputableTime?: number | null
}

export type ShiftRequest = {
  EmployeeId: number
  BusinessDate: string
  TypeOfRequest: string
  ShiftRequestDate: string
  ReasonRequest: string
  State: number
  IsScheduledShifts: boolean
  IsNew: boolean
}

export type Colleague = {
  Id: number
  Name?: string | null
  Surname?: string | null
  ShiftStart?: string | null
  ShiftEnd?: string | null
  Image?: string | null
}

export type ShiftDetail = {
  Id: number
  StartDate: string
  EndDate: string
  UnitDescription: string
  Colleagues: Colleague[]
}

import type { ExistingShiftRequest, ShiftDay, ShiftRequestPayload, ShiftRequestResult, ShiftRequestType } from '../../../types'

export type DashboardShiftDetail = {
  Id: number
  StartDate: string
  EndDate: string
  UnitId: number
  UnitDescription: string
  Colleagues: Array<{
    Id: number
    Name?: string | null
    Surname?: string | null
    ShiftStart?: string | null
    ShiftEnd?: string | null
    Image?: string | null
  }>
}

export type DashboardSummaryCard = {
  key: 'month' | 'week'
  label: string
  actualHours: number
  predictedHours: number
  earnings: number
}

export type DashboardViewProps = {
  monthActualHours: number
  monthPredictedHours: number
  previousMonthActualHours: number
  weekActualHours: number
  weekPredictedHours: number
  monthEarnings: number
  previousMonthEarnings: number
  weekEarnings: number
  lastUpdatedText: string
  employeeId: number | null
  requestDate: string
  requestType: ShiftRequestType
  requestStartTime: string
  requestEndTime: string
  selectedDates: string[]
  existingShiftRequests: ExistingShiftRequest[]
  scheduledShifts: ShiftDay[]
  shiftDetails: DashboardShiftDetail[]
  shiftDetailsDate: string | null
  isShiftDetailsOpen: boolean
  isShiftDetailsLoading: boolean
  requestQueue: ShiftRequestPayload[]
  requestResults: ShiftRequestResult[]
  requestError: string
  isSubmittingRequests: boolean
}

export type DashboardViewEvents = {
  refresh: []
  logout: []
  'update:employee-id': [value: string]
  'update:request-date': [value: string]
  'update:request-type': [value: ShiftRequestType]
  'update:request-start-time': [value: string]
  'update:request-end-time': [value: string]
  'add-request': []
  'add-request-type': [value: ShiftRequestType]
  'toggle-date': [value: string]
  'clear-selection': []
  'remove-existing-request': [value: string]
  'submit-requests': []
  'remove-request': [index: number]
  'remove-result': [index: number]
  'open-shift-details': [date: string]
  'close-shift-details': []
}

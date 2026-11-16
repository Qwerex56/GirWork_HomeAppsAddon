import type { AttendanceRecord, ShiftDay } from '../api/types'
import { apiDateKey, isInRange, type DateRange } from './dates'

export const HOURLY_RATE = 31.4

export type PeriodSummary = {
  actualHours: number
  predictedHours: number
  earnings: number
}

export function summarizePeriod(range: DateRange, shifts: ShiftDay[], attendance: AttendanceRecord[]): PeriodSummary {
  const actualSeconds = attendance
    .filter((record) => isInRange(apiDateKey(record.BusinessDate), range))
    .reduce((total, record) => total + (record.NetComputableTime ?? 0), 0)

  const predictedMs = shifts
    .filter((day) => isInRange(apiDateKey(day.BusinessDate), range))
    .flatMap((day) => day.Shifts ?? [])
    .reduce((total, shift) => {
      const length = new Date(shift.EndDate).getTime() - new Date(shift.StartDate).getTime()
      return Number.isFinite(length) ? total + length : total
    }, 0)

  const actualHours = actualSeconds / 3600
  return {
    actualHours,
    predictedHours: predictedMs / 3_600_000,
    earnings: actualHours * HOURLY_RATE,
  }
}

export function formatHours(value: number): string {
  return `${value.toFixed(2)} h`
}

const currency = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' })

export function formatCurrency(value: number): string {
  return currency.format(value)
}

export function progress(actual: number, predicted: number): number {
  return predicted > 0 ? Math.min(Math.max(actual / predicted, 0), 1) : 0
}

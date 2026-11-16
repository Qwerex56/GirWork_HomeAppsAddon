import { HOURLY_RATE, hoursFromMilliseconds, hoursFromSeconds, parseISODate } from '../../../services/workTime'
import type { AttendanceRecord, ShiftDay } from '../../../types'

export type PeriodKey = 'month' | 'week'

export type PeriodSummary = {
  actualHours: number
  predictedHours: number
  earnings: number
}

export type SummaryCardConfig = {
  key: PeriodKey
  label: string
  actualHours: number
  predictedHours: number
  earnings: number
}

export function summarizePeriod(
  period: PeriodKey,
  shifts: ShiftDay[],
  attendance: AttendanceRecord[],
  referenceDate: Date = new Date(),
): PeriodSummary {
  const interval = period === 'month'
    ? {
        start: new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1),
        end: new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 23, 59, 59, 999),
      }
    : (() => {
        const now = new Date(referenceDate)
        const day = now.getDay()
        const diffToMonday = day === 0 ? -6 : 1 - day
        const start = new Date(now)
        start.setDate(now.getDate() + diffToMonday)
        start.setHours(0, 0, 0, 0)

        const end = new Date(start)
        end.setDate(start.getDate() + 6)
        end.setHours(23, 59, 59, 999)

        return { start, end }
      })()

  const actualSeconds = attendance
    .filter((record) => {
      const date = parseISODate(record.BusinessDate)
      return date ? date >= interval.start && date <= interval.end : false
    })
    .reduce((total, record) => total + (record.NetComputableTime ?? 0), 0)

  const predictedMs = shifts
    .filter((day) => {
      const date = parseISODate(day.BusinessDate)
      return date ? date >= interval.start && date <= interval.end : false
    })
    .flatMap((day) => day.Shifts)
    .reduce((total, shift) => {
      const start = parseISODate(shift.StartDate)
      const end = parseISODate(shift.EndDate)
      if (!start || !end) return total
      return total + (end.getTime() - start.getTime())
    }, 0)

  const actualHours = hoursFromSeconds(actualSeconds)
  const predictedHours = hoursFromMilliseconds(predictedMs)

  return {
    actualHours,
    predictedHours,
    earnings: actualHours * HOURLY_RATE,
  }
}

export function buildSummaryCards(month: PeriodSummary, week: PeriodSummary): SummaryCardConfig[] {
  return [
    {
      key: 'month',
      label: 'Aktualny miesiąc',
      actualHours: month.actualHours,
      predictedHours: month.predictedHours,
      earnings: month.earnings,
    },
    {
      key: 'week',
      label: 'Aktualny tydzień',
      actualHours: week.actualHours,
      predictedHours: week.predictedHours,
      earnings: week.earnings,
    },
  ]
}

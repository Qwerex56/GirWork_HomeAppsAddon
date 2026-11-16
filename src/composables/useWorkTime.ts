import { ref } from 'vue'
import * as api from '../api/client'
import type { ShiftDay } from '../api/types'
import { addDays, endOfMonth, startOfMonth, startOfWeek } from '../domain/dates'
import { summarizePeriod, type PeriodSummary } from '../domain/hours'
import { errorMessage, useSession } from './useSession'

const EMPTY: PeriodSummary = { actualHours: 0, predictedHours: 0, earnings: 0 }

/** Worked and planned hours plus the schedule shown in the calendar. */
export function useWorkTime() {
  const { withToken } = useSession()

  const shifts = ref<ShiftDay[]>([])
  const month = ref(EMPTY)
  const week = ref(EMPTY)
  const previousMonth = ref(EMPTY)
  const lastUpdated = ref('')
  const isLoading = ref(false)
  const error = ref('')

  async function load(): Promise<void> {
    isLoading.value = true
    error.value = ''

    const today = new Date()
    const monthStart = startOfMonth(today)
    const previousMonthStart = startOfMonth(addDays(monthStart, -1))
    const weekStart = startOfWeek(today)

    try {
      const [schedule, attendance] = await withToken((token) =>
        Promise.all([api.fetchShifts(token), api.fetchAttendance(token, previousMonthStart)]),
      )

      shifts.value = schedule
      month.value = summarizePeriod({ start: monthStart, end: endOfMonth(today) }, schedule, attendance)
      week.value = summarizePeriod({ start: weekStart, end: addDays(weekStart, 6) }, schedule, attendance)
      previousMonth.value = summarizePeriod(
        { start: previousMonthStart, end: endOfMonth(previousMonthStart) },
        schedule,
        attendance,
      )
      lastUpdated.value = new Date().toLocaleString('pl-PL')
    } catch (e) {
      error.value = errorMessage(e, 'Nie udało się pobrać danych.')
    } finally {
      isLoading.value = false
    }
  }

  return { shifts, month, week, previousMonth, lastUpdated, isLoading, error, load }
}

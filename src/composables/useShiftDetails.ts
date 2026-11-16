import { ref } from 'vue'
import * as api from '../api/client'
import type { ShiftDetail } from '../api/types'
import { errorMessage, useSession } from './useSession'

/** Who works on a given day, shown in a modal. */
export function useShiftDetails() {
  const { withToken } = useSession()

  const date = ref<string | null>(null)
  const details = ref<ShiftDetail[]>([])
  const isLoading = ref(false)
  const error = ref('')

  async function open(day: string): Promise<void> {
    date.value = day
    details.value = []
    error.value = ''
    isLoading.value = true

    try {
      const result = await withToken((token) => api.fetchColleaguesOnShift(token, day))
      // Ignore a late answer for a day the user already closed or switched away from.
      if (date.value === day) details.value = result
    } catch (e) {
      error.value = errorMessage(e, 'Nie udało się pobrać szczegółów zmiany.')
    } finally {
      isLoading.value = false
    }
  }

  function close(): void {
    date.value = null
    details.value = []
  }

  return { date, details, isLoading, error, open, close }
}

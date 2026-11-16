import { computed, ref } from 'vue'
import * as api from '../api/client'
import type { ShiftRequest } from '../api/types'
import { apiDateKey, formatDate, isInRange, requestListWindow, requestWindow } from '../domain/dates'
import { encodeRequest, latestPerDay, type RequestKind } from '../domain/requests'
import { errorMessage, useSession } from './useSession'

export type QueuedRequest = { date: string; code: string }
export type SendResult = { date: string; ok: boolean; message: string }

/** Requests already on the server, the local queue waiting to be sent, and the calendar selection. */
export function useShiftRequests() {
  const { withToken, requireEmployeeId } = useSession()

  const existing = ref<ShiftRequest[]>([])
  const queue = ref<QueuedRequest[]>([])
  const selected = ref<string[]>([])
  const results = ref<SendResult[]>([])
  const isSending = ref(false)
  const error = ref('')

  const existingDates = computed(() => new Set(existing.value.map((r) => apiDateKey(r.BusinessDate))))

  function canRequest(date: string): boolean {
    return isInRange(date, requestWindow()) && !existingDates.value.has(date)
  }

  async function load(): Promise<void> {
    const { start, end } = requestListWindow()
    try {
      const requests = await withToken((token) => api.fetchShiftRequests(token, start, end))
      existing.value = latestPerDay(requests).filter((r) => isInRange(apiDateKey(r.BusinessDate), { start, end }))
    } catch (e) {
      error.value = errorMessage(e, 'Nie udało się pobrać wniosków.')
    }
  }

  function toggleDate(date: string): void {
    if (!canRequest(date)) return
    selected.value = selected.value.includes(date)
      ? selected.value.filter((d) => d !== date)
      : [...selected.value, date]
  }

  function clearSelection(): void {
    selected.value = []
  }

  /** Queues one request per selected day. A day already in the queue is replaced, never duplicated. */
  function queueSelected(kind: RequestKind, start: string, end: string): void {
    const dates = selected.value.filter(canRequest)
    if (dates.length === 0) {
      const { start: from, end: to } = requestWindow()
      error.value = `Wybierz dni z zakresu ${formatDate(from)} – ${formatDate(to)} bez istniejącego wniosku.`
      return
    }

    const code = encodeRequest(kind, start, end)
    const others = queue.value.filter((item) => !dates.includes(item.date))
    queue.value = [...others, ...dates.map((date) => ({ date, code }))].sort((a, b) => a.date.localeCompare(b.date))
    selected.value = []
    error.value = ''
  }

  function unqueue(date: string): void {
    queue.value = queue.value.filter((item) => item.date !== date)
  }

  async function sendQueue(): Promise<void> {
    if (isSending.value || queue.value.length === 0) return
    isSending.value = true
    error.value = ''

    try {
      const employeeId = await withToken(() => requireEmployeeId())
      const outcome: SendResult[] = []

      for (const item of queue.value) {
        try {
          await withToken((token) => api.sendShiftRequest(token, employeeId, item.date, item.code))
          outcome.push({ date: item.date, ok: true, message: 'Wysłano.' })
        } catch (e) {
          outcome.push({ date: item.date, ok: false, message: errorMessage(e, 'Nieznany błąd.') })
        }
      }

      // Failed items stay queued so they can be retried; the server list is the source of truth for the rest.
      const failed = new Set(outcome.filter((r) => !r.ok).map((r) => r.date))
      queue.value = queue.value.filter((item) => failed.has(item.date))
      results.value = outcome
      await load()
    } catch (e) {
      error.value = errorMessage(e, 'Nie udało się wysłać wniosków.')
    } finally {
      isSending.value = false
    }
  }

  async function removeExisting(date: string): Promise<void> {
    if (!isInRange(date, requestWindow())) {
      error.value = 'Nie można usuwać wniosków spoza aktywnego okna dat.'
      return
    }

    try {
      const removed = await withToken((token) => api.removeShiftRequest(token, date))
      if (!removed) throw new Error('Nie udało się usunąć wniosku.')
      await load()
    } catch (e) {
      error.value = errorMessage(e, 'Nie udało się usunąć wniosku.')
    }
  }

  function clearResults(): void {
    results.value = []
  }

  return {
    existing,
    queue,
    selected,
    results,
    isSending,
    error,
    canRequest,
    load,
    toggleDate,
    clearSelection,
    queueSelected,
    unqueue,
    sendQueue,
    removeExisting,
    clearResults,
  }
}

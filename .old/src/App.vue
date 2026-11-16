<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import WorkTimeDashboardView from './views/WorkTimeDashboardView.vue'
import {
  buildShiftRequestPayload,
  fetchAttendance,
  fetchColleaguesOnShift,
  fetchShifts,
  fetchUserData,
  getMonthInterval,
  HOURLY_RATE,
  fetchShiftRequests,
  removeShiftRequest,
  requestToken,
  submitShiftRequestSeries,
} from './services/workTime'
import { summarizePeriod } from './features/dashboard/composables/usePeriodMetrics'
import type {
  ExistingShiftRequest,
  ShiftDay,
  ShiftDetailDay,
  ShiftRequestPayload,
  ShiftRequestResult,
  ShiftRequestType,
} from './types'

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const accessToken = ref(localStorage.getItem('gir_access_token') ?? '')
const isAuthenticated = ref(Boolean(accessToken.value))
const monthActualHours = ref(0)
const monthPredictedHours = ref(0)
const previousMonthActualHours = ref(0)
const weekActualHours = ref(0)
const weekPredictedHours = ref(0)
const lastUpdatedText = ref('')

const employeeId = ref<number | null>(null)
const requestDate = ref(new Date().toISOString().slice(0, 10))
const requestType = ref<ShiftRequestType>('FULL_DAY')
const requestStartTime = ref('09:00')
const requestEndTime = ref('15:00')
const selectedDates = ref<string[]>([])
const requestQueue = ref<ShiftRequestPayload[]>([])
const existingShiftRequests = ref<ExistingShiftRequest[]>([])
const scheduledShifts = ref<ShiftDay[]>([])
const requestResults = ref<ShiftRequestResult[]>([])
const shiftDetails = ref<ShiftDetailDay[]>([])
const shiftDetailsDate = ref<string | null>(null)
const isShiftDetailsModalOpen = ref(false)
const isShiftDetailsLoading = ref(false)
const requestError = ref('')
const isSubmittingRequests = ref(false)

const knownShiftManagers = {
  2568: 'Jakub Tomaszewski',
  2569: 'Daria Czyż',
  2301: 'Izabela Borowik',
  2287: 'Sandra Proń',
  2300: 'Monika Jędryka',
} as const

function normalizeName(value?: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function resolvePersonNameFromRoster(
  person: { Id?: number; Name?: string | null; Surname?: string | null },
  roster: Array<{ Id?: number; Name?: string | null; Surname?: string | null }>,
): { Name?: string | null; Surname?: string | null } {
  const currentName = (person.Name ?? '').trim()
  const currentSurname = (person.Surname ?? '').trim()

  if (currentName && currentSurname) {
    return person
  }

  if (person.Id && knownShiftManagers[person.Id as keyof typeof knownShiftManagers]) {
    const managerName = knownShiftManagers[person.Id as keyof typeof knownShiftManagers]
    const [firstName, ...surnameParts] = managerName.split(' ')
    return {
      Name: firstName,
      Surname: surnameParts.join(' '),
    }
  }

  const sameIdMatch = roster.find((entry) => entry.Id === person.Id && Boolean(entry.Name || entry.Surname))
  if (sameIdMatch) {
    return {
      Name: sameIdMatch.Name ?? currentName,
      Surname: sameIdMatch.Surname ?? currentSurname,
    }
  }

  const managerNameMatch = Object.values(knownShiftManagers).find((manager) => {
    const normalizedManager = normalizeName(manager)
    const normalizedCandidate = normalizeName(`${currentName} ${currentSurname}`.trim())
    const normalizedFirstName = normalizeName(currentName)

    return normalizedCandidate === normalizedManager || normalizedFirstName === normalizeName(manager.split(' ')[0] ?? '')
  })

  if (managerNameMatch) {
    const [firstName, ...surnameParts] = managerNameMatch.split(' ')
    return {
      Name: firstName,
      Surname: surnameParts.join(' '),
    }
  }

  return person
}

function enrichShiftDetailsWithResolvedNames(result: ShiftDetailDay[]): ShiftDetailDay[] {
  const roster = result.flatMap((day) => day.Colleagues ?? [])

  return result.map((day) => ({
    ...day,
    Colleagues: (day.Colleagues ?? []).map((person) => {
      const resolved = resolvePersonNameFromRoster(person, roster)
      return {
        ...person,
        Name: resolved.Name ?? person.Name,
        Surname: resolved.Surname ?? person.Surname,
      }
    }),
  }))
}

const monthEarnings = computed(() => monthActualHours.value * HOURLY_RATE)
const weekEarnings = computed(() => weekActualHours.value * HOURLY_RATE)

function getStartOfWeek(date: Date): Date {
  const start = new Date(date)
  const day = start.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diffToMonday)
  start.setHours(0, 0, 0, 0)
  return start
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function getRequestWindow(): { start: Date; end: Date } {
  const today = new Date()
  const currentWeekStart = getStartOfWeek(today)
  const start = addDays(currentWeekStart, 15)
  const end = addDays(start, 365)

  return { start, end }
}

function getRequestDisplayWindow(): { start: Date; end: Date } {
  const { start, end } = getRequestWindow()
  const displayStart = new Date(start)
  displayStart.setDate(displayStart.getDate() - 7)
  return { start: displayStart, end }
}

function isDateAllowedForRequest(dateValue: string): boolean {
  if (!dateValue) return false

  const requestDate = new Date(`${dateValue}T00:00:00`)
  const { start, end } = getRequestWindow()
  return requestDate >= start && requestDate <= end
}

function filterVisibleRequests(requests: ExistingShiftRequest[]): ExistingShiftRequest[] {
  return requests.filter((request) => {
    const date = request.BusinessDate.slice(0, 10)
    const requestDate = new Date(`${date}T00:00:00`)
    const { start, end } = getRequestDisplayWindow()
    return requestDate >= start && requestDate <= end
  })
}

onMounted(async () => {
  const { start, end } = getRequestWindow()
  if (!isDateAllowedForRequest(requestDate.value)) {
    requestDate.value = start.toISOString().slice(0, 10)
  }

  if (requestDate.value > end.toISOString().slice(0, 10)) {
    requestDate.value = end.toISOString().slice(0, 10)
  }

  if (accessToken.value) {
    await loadDashboard()
  }
})

async function login(): Promise<void> {
  if (!email.value.trim() || !password.value.trim()) {
    errorMessage.value = 'Uzupełnij e-mail i hasło.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const loginResult = await requestToken(email.value.trim(), password.value)
    accessToken.value = loginResult.token
    employeeId.value = loginResult.employeeId ?? null
    localStorage.setItem('gir_access_token', loginResult.token)
    isAuthenticated.value = true
    await loadDashboard()
  } catch (error) {
    isAuthenticated.value = false
    errorMessage.value = error instanceof Error ? error.message : 'Nie udało się zalogować.'
  } finally {
    isLoading.value = false
  }
}

async function loadCurrentShiftRequests(): Promise<void> {
  if (!accessToken.value) return

  const { start, end } = getRequestDisplayWindow()
  const requests = await fetchShiftRequests(accessToken.value, start, end)
  existingShiftRequests.value = filterVisibleRequests(requests)
}

async function ensureEmployeeId(): Promise<void> {
  if (!accessToken.value || (employeeId.value && employeeId.value > 0)) {
    return
  }

  const resolvedId = await fetchUserData(accessToken.value)
  employeeId.value = resolvedId ?? null
}

async function loadDashboard(): Promise<void> {
  if (!accessToken.value) {
    isAuthenticated.value = false
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await ensureEmployeeId()
    const now = new Date()
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const monthInterval = getMonthInterval()
    const shifts = await fetchShifts(accessToken.value)
    scheduledShifts.value = shifts
    const currentMonthAttendance = await fetchAttendance(accessToken.value, monthInterval.start)
    const previousMonthAttendance = await fetchAttendance(accessToken.value, previousMonthDate)
    await loadCurrentShiftRequests()

    const monthSummary = summarizePeriod('month', shifts, currentMonthAttendance)
    const previousMonthSummary = summarizePeriod('month', shifts, previousMonthAttendance, previousMonthDate)
    const weekSummary = summarizePeriod('week', shifts, currentMonthAttendance)

    monthActualHours.value = monthSummary.actualHours
    monthPredictedHours.value = monthSummary.predictedHours
    previousMonthActualHours.value = previousMonthSummary.actualHours
    weekActualHours.value = weekSummary.actualHours
    weekPredictedHours.value = weekSummary.predictedHours
    lastUpdatedText.value = new Date().toLocaleString('pl-PL')
    isAuthenticated.value = true
  } catch (error) {
    isAuthenticated.value = false
    monthActualHours.value = 0
    monthPredictedHours.value = 0
    previousMonthActualHours.value = 0
    weekActualHours.value = 0
    weekPredictedHours.value = 0
    lastUpdatedText.value = ''
    errorMessage.value = error instanceof Error ? error.message : 'Nie udało się pobrać danych.'
  } finally {
    isLoading.value = false
  }
}

function logout(): void {
  accessToken.value = ''
  localStorage.removeItem('gir_access_token')
  isAuthenticated.value = false
  monthActualHours.value = 0
  monthPredictedHours.value = 0
  previousMonthActualHours.value = 0
  weekActualHours.value = 0
  weekPredictedHours.value = 0
  lastUpdatedText.value = ''
  errorMessage.value = ''
  requestQueue.value = []
  existingShiftRequests.value = []
  scheduledShifts.value = []
  requestResults.value = []
  requestError.value = ''
  employeeId.value = null
}

function updateEmployeeId(value: string): void {
  const parsed = Number(value)
  employeeId.value = Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

async function addRequestTypeToQueue(type: ShiftRequestType, dates: string[] = selectedDates.value): Promise<void> {
  const candidates = dates.length > 0 ? dates : [requestDate.value]
  if (candidates.length === 0 || !candidates.some(Boolean)) {
    requestError.value = 'Wybierz datę wniosku.'
    return
  }

  const alreadyRequested = candidates.filter((date) =>
    existingShiftRequests.value.some((request) => request.BusinessDate.slice(0, 10) === date),
  )

  if (alreadyRequested.length > 0) {
    requestError.value = 'Niektóre wybrane dni już mają wpisany wniosek. Usuń je albo wybierz inne daty.'
    return
  }

  const invalid = candidates.find((date) => !isDateAllowedForRequest(date))
  if (invalid) {
    const { start, end } = getRequestWindow()
    requestError.value = `Dla wniosku dostępne są tylko daty od ${start.toLocaleDateString('pl-PL')} do ${end.toLocaleDateString('pl-PL')}.`
    return
  }

  let employeeIdValue = employeeId.value
  if (!employeeIdValue || employeeIdValue <= 0) {
    requestError.value = 'Trwa pobieranie numeru pracownika. Spróbuj ponownie za chwilę.'
    const resolvedId = await fetchUserData(accessToken.value)
    employeeId.value = resolvedId ?? null
    employeeIdValue = employeeId.value
    if (!employeeIdValue || employeeIdValue <= 0) {
      requestError.value = 'Brak identyfikatora pracownika. Zaloguj się ponownie.'
      return
    }
  }

  requestError.value = ''
  const payloads = candidates.map((date) =>
    buildShiftRequestPayload(
      employeeIdValue,
      date,
      type,
      requestStartTime.value,
      requestEndTime.value,
    ),
  )

  requestQueue.value.push(...payloads)
  selectedDates.value = []
}

function addRequestToQueue(): void {
  addRequestTypeToQueue(requestType.value)
}

function toggleSelectedDate(date: string): void {
  if (!isDateAllowedForRequest(date)) return
  if (existingShiftRequests.value.some((request) => request.BusinessDate.slice(0, 10) === date)) return

  const index = selectedDates.value.indexOf(date)
  if (index >= 0) {
    selectedDates.value.splice(index, 1)
    return
  }

  selectedDates.value.push(date)
  requestDate.value = date
}

function clearSelectedDates(): void {
  selectedDates.value = []
}

async function removeExistingRequest(date: string): Promise<void> {
  if (!accessToken.value) return

  if (!isDateAllowedForRequest(date)) {
    requestError.value = 'Nie można usuwać wniosków spoza aktywnego okna dat.'
    return
  }

  const removed = await removeShiftRequest(accessToken.value, date)
  if (removed) {
    existingShiftRequests.value = existingShiftRequests.value.filter(
      (request) => request.BusinessDate.slice(0, 10) !== date,
    )
    requestError.value = ''
  } else {
    requestError.value = 'Nie udało się usunąć wniosku.'
  }
}

function removeQueuedRequest(index: number): void {
  requestQueue.value.splice(index, 1)
}

async function submitRequestQueue(): Promise<void> {
  if (!accessToken.value) {
    requestError.value = 'Najpierw zaloguj się.'
    return
  }

  if (requestQueue.value.length === 0) {
    requestError.value = 'Dodaj conajmniej jeden wniosek do wysyłki.'
    return
  }

  isSubmittingRequests.value = true
  requestError.value = ''

  try {
    const results = await submitShiftRequestSeries(accessToken.value, requestQueue.value)
    const successful = results.filter((result) => result.success)
    const failed = results.filter((result) => !result.success)

    requestResults.value = [...results, ...requestResults.value]
    requestQueue.value = requestQueue.value.filter((request) => {
      const matchingResult = failed.find((result) => result.date === request.BusinessDate)
      return !matchingResult
    })

    if (successful.length > 0) {
      selectedDates.value = []
      requestQueue.value = []
      await loadDashboard()
    }
  } catch (error) {
    requestError.value = error instanceof Error ? error.message : 'Nie udało się wysłać serii wniosków.'
  } finally {
    isSubmittingRequests.value = false
  }
}

async function removeRequestResult(index: number): Promise<void> {
  if (!accessToken.value) return

  const item = requestResults.value[index]
  if (!item) return

  const removed = await removeShiftRequest(accessToken.value, item.date)
  if (removed) {
    requestResults.value.splice(index, 1)
  } else {
    requestError.value = `Nie udało się usunąć wniosku z dnia ${item.date}.`
  }
}

async function openShiftDetails(date: string): Promise<void> {
  if (!accessToken.value) return

  isShiftDetailsLoading.value = true
  isShiftDetailsModalOpen.value = true
  shiftDetailsDate.value = date
  shiftDetails.value = []

  try {
    const result = await fetchColleaguesOnShift(accessToken.value, date)
    const enrichedResult = enrichShiftDetailsWithResolvedNames(result)
    shiftDetails.value = enrichedResult
  } catch (error) {
    shiftDetails.value = []
    requestError.value = error instanceof Error ? error.message : 'Nie udało się pobrać szczegółów zmiany.'
  } finally {
    isShiftDetailsLoading.value = false
  }
}

function closeShiftDetails(): void {
  isShiftDetailsModalOpen.value = false
  shiftDetailsDate.value = null
  shiftDetails.value = []
}
</script>

<template>
  <main class="app-shell">
    <WorkTimeDashboardView
      :email="email"
      :password="password"
      :error-message="errorMessage"
      :is-loading="isLoading"
      :is-authenticated="isAuthenticated"
      :month-actual-hours="monthActualHours"
      :month-predicted-hours="monthPredictedHours"
      :previous-month-actual-hours="previousMonthActualHours"
      :week-actual-hours="weekActualHours"
      :week-predicted-hours="weekPredictedHours"
      :month-earnings="monthEarnings"
      :previous-month-earnings="previousMonthActualHours * HOURLY_RATE"
      :week-earnings="weekEarnings"
      :last-updated-text="lastUpdatedText"
      :employee-id="employeeId"
      :request-date="requestDate"
      :request-type="requestType"
      :request-start-time="requestStartTime"
      :request-end-time="requestEndTime"
      :selected-dates="selectedDates"
      :existing-shift-requests="existingShiftRequests"
      :scheduled-shifts="scheduledShifts"
      :request-queue="requestQueue"
      :request-results="requestResults"
      :shift-details="shiftDetails"
      :shift-details-date="shiftDetailsDate"
      :is-shift-details-open="isShiftDetailsModalOpen"
      :is-shift-details-loading="isShiftDetailsLoading"
      :request-error="requestError"
      :is-submitting-requests="isSubmittingRequests"
      @update:email="email = $event"
      @update:password="password = $event"
      @login="login"
      @refresh="loadDashboard"
      @logout="logout"
      @update:employee-id="updateEmployeeId"
      @update:request-date="requestDate = $event"
      @update:request-type="requestType = $event"
      @update:request-start-time="requestStartTime = $event"
      @update:request-end-time="requestEndTime = $event"
      @add-request="addRequestToQueue"
      @add-request-type="addRequestTypeToQueue"
      @toggle-date="toggleSelectedDate"
      @clear-selection="clearSelectedDates"
      @remove-existing-request="removeExistingRequest"
      @submit-requests="submitRequestQueue"
      @remove-request="removeQueuedRequest"
      @remove-result="removeRequestResult"
      @open-shift-details="openShiftDetails"
      @close-shift-details="closeShiftDetails"
    />
  </main>
</template>

<style scoped>
:global(body) {
  margin: 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #111827 100%);
  font-family: Inter, 'Segoe UI', sans-serif;
}

* {
  box-sizing: border-box;
}

.app-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
}
</style>

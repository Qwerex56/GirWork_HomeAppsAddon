<script setup lang="ts">
import { computed, ref } from 'vue'
import SummaryCards from './SummaryCards.vue'
import RequestForm from './RequestForm.vue'
import CalendarGrid from './CalendarGrid.vue'
import RequestQueue from './RequestQueue.vue'
import ShiftDetailsModal from './ShiftDetailsModal.vue'
import type { ExistingShiftRequest, ShiftDay, ShiftRequestPayload, ShiftRequestResult, ShiftRequestType } from '../../../types'

const props = defineProps<{
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
  shiftDetails: Array<{
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
  }>
  shiftDetailsDate: string | null
  isShiftDetailsOpen: boolean
  isShiftDetailsLoading: boolean
  requestQueue: ShiftRequestPayload[]
  requestResults: ShiftRequestResult[]
  requestError: string
  isSubmittingRequests: boolean
}>()

const emit = defineEmits<{
  (event: 'refresh'): void
  (event: 'logout'): void
  (event: 'update:employee-id', value: string): void
  (event: 'update:request-date', value: string): void
  (event: 'update:request-type', value: ShiftRequestType): void
  (event: 'update:request-start-time', value: string): void
  (event: 'update:request-end-time', value: string): void
  (event: 'add-request'): void
  (event: 'add-request-type', value: ShiftRequestType): void
  (event: 'toggle-date', value: string): void
  (event: 'clear-selection'): void
  (event: 'remove-existing-request', value: string): void
  (event: 'submit-requests'): void
  (event: 'remove-request', index: number): void
  (event: 'remove-result', index: number): void
  (event: 'open-shift-details', date: string): void
  (event: 'close-shift-details'): void
}>()

const currentRequestWeekIndex = ref(0)

function getNearestFreezeWindow(): { start: Date; end: Date } {
  const today = new Date()
  const start = new Date(today)
  start.setHours(0, 0, 0, 0)

  const currentWeekStart = new Date(start)
  const day = currentWeekStart.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  currentWeekStart.setDate(currentWeekStart.getDate() + diffToMonday)

  const freezeStart = new Date(currentWeekStart)
  freezeStart.setDate(freezeStart.getDate() + 14)

  const freezeEnd = new Date(freezeStart)
  freezeEnd.setDate(freezeEnd.getDate() + 7)
  freezeEnd.setDate(freezeEnd.getDate() - 1)

  return { start: freezeStart, end: freezeEnd }
}

const freezeWindow = computed(() => getNearestFreezeWindow())

function getWeekStart(dateValue: string): Date {
  const parsed = new Date(`${dateValue}T00:00:00`)
  const start = new Date(parsed)
  const day = start.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diffToMonday)
  start.setHours(0, 0, 0, 0)
  return start
}

const requestWeeks = computed(() => {
  const grouped = new Map<string, ExistingShiftRequest[]>()

  for (const request of [...props.existingShiftRequests].sort((left, right) => left.BusinessDate.localeCompare(right.BusinessDate))) {
    const weekStart = getWeekStart(request.BusinessDate.slice(0, 10))
    const key = weekStart.toISOString().slice(0, 10)
    const existing = grouped.get(key) ?? []
    existing.push(request)
    grouped.set(key, existing)
  }

  return Array.from(grouped.entries())
    .map(([key, requests]) => {
      const start = new Date(`${key}T00:00:00`)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)

      return {
        key,
        label: `${start.toLocaleDateString('pl-PL', { day: 'numeric', month: 'numeric' })} – ${end.toLocaleDateString('pl-PL', { day: 'numeric', month: 'numeric' })}`,
        requests,
      }
    })
    .sort((left, right) => left.key.localeCompare(right.key))
})

const visibleRequestWeek = computed(() => requestWeeks.value[currentRequestWeekIndex.value] ?? null)

function shiftRequestWeek(delta: number): void {
  if (requestWeeks.value.length === 0) return

  const nextIndex = currentRequestWeekIndex.value + delta
  currentRequestWeekIndex.value = Math.min(Math.max(nextIndex, 0), requestWeeks.value.length - 1)
}
</script>

<template>
  <section class="dashboard-panel">
    <header class="topbar">
      <div>
        <p class="eyebrow">Gir Work Time Counter</p>
        <h1>Podsumowanie</h1>
      </div>

      <div class="topbar-actions">
        <button class="secondary-button" @click="emit('refresh')">Odśwież</button>
        <button class="ghost-button" @click="emit('logout')">Wyloguj</button>
      </div>
    </header>

    <SummaryCards
      :month-actual-hours="props.monthActualHours"
      :month-predicted-hours="props.monthPredictedHours"
      :previous-month-actual-hours="props.previousMonthActualHours"
      :week-actual-hours="props.weekActualHours"
      :week-predicted-hours="props.weekPredictedHours"
      :month-earnings="props.monthEarnings"
      :previous-month-earnings="props.previousMonthEarnings"
      :week-earnings="props.weekEarnings"
    />

    <RequestForm
      :request-type="props.requestType"
      :request-start-time="props.requestStartTime"
      :request-end-time="props.requestEndTime"
      :selected-dates="props.selectedDates"
      :request-queue="props.requestQueue"
      :request-error="props.requestError"
      :is-submitting-requests="props.isSubmittingRequests"
      :freeze-window-label="`${freezeWindow.start.toLocaleDateString('pl-PL')} – ${freezeWindow.end.toLocaleDateString('pl-PL')}`"
      @update:request-type="emit('update:request-type', $event)"
      @update:request-start-time="emit('update:request-start-time', $event)"
      @update:request-end-time="emit('update:request-end-time', $event)"
      @add-request-type="emit('add-request-type', $event)"
      @clear-selection="emit('clear-selection')"
      @submit-requests="emit('submit-requests')"
    />

    <CalendarGrid
      :selected-dates="props.selectedDates"
      :request-date="props.requestDate"
      :existing-shift-requests="props.existingShiftRequests"
      :scheduled-shifts="props.scheduledShifts"
      :request-queue="props.requestQueue"
      @toggle-date="emit('toggle-date', $event)"
      @open-shift-details="emit('open-shift-details', $event)"
    />

    <RequestQueue
      :existing-shift-requests="props.existingShiftRequests"
      :request-queue="props.requestQueue"
      :request-results="props.requestResults"
      :request-weeks="requestWeeks"
      :visible-request-week="visibleRequestWeek"
      :current-request-week-index="currentRequestWeekIndex"
      @remove-existing-request="emit('remove-existing-request', $event)"
      @remove-request="emit('remove-request', $event)"
      @remove-result="emit('remove-result', $event)"
      @shift-request-week="shiftRequestWeek($event)"
    />

    <ShiftDetailsModal
      :is-open="props.isShiftDetailsOpen"
      :shift-details-date="props.shiftDetailsDate"
      :shift-details="props.shiftDetails"
      :is-loading="props.isShiftDetailsLoading"
      @close-shift-details="emit('close-shift-details')"
    />

    <div v-if="props.lastUpdatedText" class="updated-text">
      Ostatnia aktualizacja: {{ props.lastUpdatedText }}
    </div>
  </section>
</template>

<style scoped>
.dashboard-panel {
  width: min(100%, 1100px);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.topbar,
.summary-card,
.request-panel {
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 24px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.28);
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
}

@media (max-width: 640px) {
  .topbar {
    padding: 14px 16px;
  }

  .topbar-actions {
    gap: 8px;
  }

  .secondary-button,
  .ghost-button,
  .primary-button {
    padding: 8px 10px;
    font-size: 0.82rem;
  }
}

.eyebrow {
  margin: 0 0 8px;
  color: #8b5cf6;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1,
h2,
h3 {
  margin: 0;
  color: white;
}

h1 {
  font-size: clamp(2rem, 4vw, 2.8rem);
}

.topbar-actions {
  display: flex;
  gap: 12px;
}

.secondary-button,
.ghost-button,
.primary-button,
.tiny-button {
  border: none;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.secondary-button:hover,
.ghost-button:hover,
.primary-button:hover,
.tiny-button:hover {
  transform: translateY(-1px);
}

.secondary-button,
.primary-button {
  padding: 10px 14px;
}

.secondary-button {
  background: rgba(99, 102, 241, 0.18);
  color: white;
}

.primary-button {
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  color: white;
}

.primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ghost-button {
  background: rgba(148, 163, 184, 0.12);
  color: #e2e8f0;
  padding: 10px 14px;
}

.summary-card {
  padding: 20px 18px;
  color: #e2e8f0;
}

.summary-card.highlight {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.25), rgba(30, 41, 59, 0.75));
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 0.95rem;
  color: #e2e8f0;
}

.card-header strong {
  color: #a78bfa;
  font-size: 1.1rem;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.metric-box {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  padding: 14px;
}

.metric-box span {
  display: block;
  color: #cbd5e1;
  font-size: 0.72rem;
  margin-bottom: 8px;
}

.metric-box strong {
  color: white;
  font-size: 1.12rem;
}

.data-list {
  list-style: none;
  padding: 0;
  margin: 0 0 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.data-list li {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: #cbd5e1;
}

.progress-wrap {
  height: 12px;
  background: rgba(148, 163, 184, 0.15);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
  border-radius: inherit;
}

.progress-fill.green {
  background: linear-gradient(90deg, #10b981, #34d399);
}

.request-panel {
  padding: 20px 18px;
  color: #e2e8f0;
}

.panel-header {
  margin-bottom: 16px;
}

.panel-subtitle {
  margin: 8px 0 0;
  color: #cbd5e1;
  font-size: 0.82rem;
}

.calendar-panel {
  margin-top: 18px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.42);
  padding: 4px;
}

.calendar-month-block + .calendar-month-block {
  margin-top: 20px;
}

.calendar-month-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
  color: #e2e8f0;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: capitalize;
}

.month-divider-tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.18);
  color: #c4b5fd;
  font-size: 0.62rem;
  letter-spacing: 0.04em;
  text-transform: lowercase;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.calendar-navigation {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  margin: 12px 0 18px;
}

.calendar-navigation strong {
  text-align: center;
  color: white;
  text-transform: capitalize;
}

.nav-button {
  justify-self: center;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.18);
  color: white;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
}

.nav-button:first-child {
  justify-self: start;
}

.nav-button:last-child {
  justify-self: end;
}

.legend {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #cbd5e1;
  font-size: 0.72rem;
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
}

.legend-dot.full {
  background: #8b5cf6;
}

.legend-dot.off {
  background: #10b981;
}

.legend-dot.hours {
  background: #f59e0b;
}

.legend-dot.before {
  background: #60a5fa;
}

.legend-dot.after {
  background: #f97316;
}

.calendar-weekdays,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
}

.calendar-weekdays {
  color: #cbd5e1;
  font-size: 0.72rem;
  margin-bottom: 8px;
  text-align: center;
}

.calendar-grid {
  grid-auto-rows: minmax(42px, 1fr);
}

.calendar-day {
  min-height: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.56);
  color: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 6px 4px;
}

.calendar-day-number {
  font-size: 0.9rem;
  font-weight: 700;
}

.calendar-day-status {
  position: absolute;
  top: 6px;
  right: 7px;
  font-size: 0.62rem;
  font-weight: 800;
  color: #f8fafc;
  background: rgba(15, 23, 42, 0.7);
  border-radius: 999px;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.calendar-day-meta {
  font-size: 0.55rem;
  line-height: 1.1;
  text-align: center;
  color: #e2e8f0;
}

.calendar-day-location {
  font-size: 0.52rem;
  line-height: 1.1;
  text-align: center;
  color: #c4b5fd;
}

.calendar-day:hover:not(:disabled) {
  border-color: rgba(167, 139, 250, 0.6);
  transform: translateY(-1px);
}

.calendar-day-disabled {
  opacity: 0.38;
  cursor: not-allowed;
  background: rgba(51, 65, 85, 0.7);
  border-color: rgba(100, 116, 139, 0.5);
}

.calendar-day-readonly {
  opacity: 0.82;
  cursor: not-allowed;
  background: rgba(51, 65, 85, 0.72);
  border-color: rgba(148, 163, 184, 0.42);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
}

.calendar-day-readonly .calendar-day-status {
  background: rgba(245, 158, 11, 0.9);
  color: #111827;
  border: 1px solid rgba(251, 191, 36, 0.7);
}

.calendar-day-scheduled {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(96, 165, 250, 0.75);
  box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.2);
}

.calendar-day-free {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.75);
  box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.22);
}

.calendar-day-blocked {
  opacity: 0.52;
  cursor: not-allowed;
  background: rgba(15, 23, 42, 0.82);
  border-color: rgba(100, 116, 139, 0.45);
}

.calendar-day.selected {
  border-color: #a78bfa;
  box-shadow: 0 0 0 1px rgba(167, 139, 250, 0.4);
}

.calendar-day.marker-full {
  background: rgba(139, 92, 246, 0.24);
  border-color: rgba(167, 139, 250, 0.8);
}

.calendar-day.marker-off {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.8);
}

.calendar-day.marker-hours {
  background: rgba(251, 146, 60, 0.15);
  border-color: rgba(251, 146, 60, 0.85);
}

.calendar-day.marker-before {
  background: rgba(96, 165, 250, 0.16);
  border-color: rgba(96, 165, 250, 0.8);
}

.calendar-day.marker-after {
  background: rgba(249, 115, 22, 0.15);
  border-color: rgba(249, 115, 22, 0.8);
}

.employee-warning {
  color: #fbbf24;
  font-size: 0.72rem;
  line-height: 1.4;
}

.request-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.request-form-grid label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #cbd5e1;
  font-size: 0.82rem;
}

.request-form-grid input,
.request-form-grid select {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.5);
  color: white;
  border-radius: 12px;
  padding: 10px 12px;
}

.request-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
}

.request-error {
  margin: 18px 0 0;
  color: #fca5a5;
  font-size: 0.85rem;
}

.request-list-box {
  margin-top: 20px;
  background: rgba(15, 23, 42, 0.48);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  padding: 16px;
}

.request-week-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.request-week-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #cbd5e1;
  font-size: 0.72rem;
}

.request-week-nav span {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.14);
  border: 1px solid rgba(165, 180, 252, 0.28);
  color: #e2e8f0;
  font-weight: 600;
}

.request-week-nav .tiny-button {
  min-width: 30px;
  padding: 6px 9px;
}

.request-week-nav .tiny-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.request-list-box ul {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.request-list-box li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: rgba(30, 41, 59, 0.68);
  border-radius: 12px;
  padding: 10px 12px;
}

.request-list-box li > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.success {
  color: #86efac;
}

.error {
  color: #fca5a5;
}

.tiny-button {
  background: rgba(148, 163, 184, 0.12);
  color: white;
  padding: 7px 10px;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 20px;
}

.modal-card {
  width: min(560px, 100%);
  max-height: 80vh;
  overflow: auto;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 22px;
  box-shadow: 0 28px 48px rgba(15, 23, 42, 0.45);
  padding: 18px;
  color: white;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.modal-loading,
.modal-empty {
  color: #cbd5e1;
  padding: 8px 0;
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.shift-detail-item {
  background: rgba(30, 41, 59, 0.7);
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  padding: 14px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #cbd5e1;
  padding: 4px 0;
}

.detail-row strong {
  color: white;
  text-align: right;
}

.colleagues-list {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.colleagues-list h4 {
  margin: 0;
  color: #e2e8f0;
  font-size: 0.8rem;
}

.colleague-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(15, 23, 42, 0.56);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 10px;
  padding: 8px 10px;
}

.colleague-row {
  border-width: 1px;
}

.manager-row {
  border-color: rgba(250, 204, 21, 0.7);
  background: linear-gradient(135deg, rgba(250, 204, 21, 0.18), rgba(120, 85, 14, 0.15));
  box-shadow: inset 0 0 0 1px rgba(250, 204, 21, 0.12);
}

.employee-row {
  border-color: rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.56);
}

.colleague-ident {
  flex-shrink: 0;
}

.colleague-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  color: white;
  font-size: 0.6rem;
  font-weight: 700;
  background-size: cover;
  background-position: center;
}

.colleague-avatar.initials {
  font-size: 0.56rem;
}

.colleague-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.colleague-row-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.colleague-text strong {
  color: white;
  font-size: 0.82rem;
}

.colleague-text small {
  color: #cbd5e1;
}

.manager-badge {
  background: rgba(250, 204, 21, 0.18);
  color: #fde68a;
  border: 1px solid rgba(250, 204, 21, 0.45);
  border-radius: 999px;
  padding: 3px 7px;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.colleagues-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.colleagues-header h4 {
  margin: 0;
}

.colleagues-header small {
  color: #f5d97d;
  font-size: 0.68rem;
}

.updated-text {
  color: #cbd5e1;
  font-size: 0.85rem;
  text-align: right;
}

@media (max-width: 820px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .topbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .topbar-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>

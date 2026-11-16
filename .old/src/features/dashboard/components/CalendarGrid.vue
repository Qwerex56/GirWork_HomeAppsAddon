<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ExistingShiftRequest, ShiftDay, ShiftRequestPayload } from '../../../types'
import { getStartOfWeek } from '../composables/useRequestPeriods'

const props = defineProps<{
  selectedDates: string[]
  requestDate: string
  existingShiftRequests: ExistingShiftRequest[]
  scheduledShifts: ShiftDay[]
  requestQueue: ShiftRequestPayload[]
}>()

const emit = defineEmits<{
  'toggle-date': [value: string]
  'open-shift-details': [date: string]
}>()

const visibleMonth = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

function formatRequestSummary(type: string): string {
  if (type === '11111') return 'Cały dzień'
  if (type === '00000') return 'Dzień wolny'
  if (type.startsWith('<')) {
    const hour = type.slice(1, 3)
    const minute = type.slice(3, 5)
    return `Praca od ${hour}:${minute}`
  }
  if (type.startsWith('>')) {
    const hour = type.slice(1, 3)
    const minute = type.slice(3, 5)
    return `Praca do ${hour}:${minute}`
  }
  if (type.startsWith('$') && type.length >= 9) {
    const from = `${type.slice(1, 3)}:${type.slice(3, 5)}`
    const to = `${type.slice(5, 7)}:${type.slice(7, 9)}`
    return `Praca ${from}-${to}`
  }
  return type
}

function formatCompactRequestLabel(type: string): string {
  if (type === '11111') return 'cały dzień'
  if (type === '00000') return 'wolne'
  if (type.startsWith('<')) {
    const hour = type.slice(1, 3)
    const minute = type.slice(3, 5)
    return `od ${hour}:${minute}`
  }
  if (type.startsWith('>')) {
    const hour = type.slice(1, 3)
    const minute = type.slice(3, 5)
    return `do ${hour}:${minute}`
  }
  if (type.startsWith('$') && type.length >= 9) {
    const from = `${type.slice(1, 3)}:${type.slice(3, 5)}`
    const to = `${type.slice(5, 7)}:${type.slice(7, 9)}`
    return `${from}-${to}`
  }
  return type
}

function findRequestForDate(date: string): ExistingShiftRequest | ShiftRequestPayload | undefined {
  return (
    props.existingShiftRequests.find((request) => request.BusinessDate.slice(0, 10) === date) ??
    props.requestQueue.find((item) => item.BusinessDate.slice(0, 10) === date)
  )
}

function getScheduledDayInfo(date: string): { summary: string; location: string; status: 'accepted' | 'rejected' | 'pending' | 'state-0' | 'state-1' | 'state-2' | null } | null {
  const scheduledDay = props.scheduledShifts.find((day) => day.BusinessDate.slice(0, 10) === date)
  const currentRequest = props.existingShiftRequests.find((request) => request.BusinessDate.slice(0, 10) === date)
  const status = currentRequest
    ? currentRequest.State === 0
      ? 'state-0'
      : currentRequest.State === 1
        ? 'state-1'
        : currentRequest.State === 2
          ? 'state-2'
          : null
    : null

  if (!scheduledDay && !currentRequest) return null

  if (!scheduledDay) {
    return {
      summary: formatRequestSummary(currentRequest!.TypeOfRequest),
      location: 'Wniosek',
      status,
    }
  }

  const shifts = scheduledDay.Shifts ?? []
  if (shifts.length === 0) {
    return {
      summary: 'Dzień wolny',
      location: '—',
      status,
    }
  }

  const summary = shifts
    .map((shift) => {
      const start = new Date(shift.StartDate)
      const end = new Date(shift.EndDate)
      const formatTime = (value: Date) => value.toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      return `${formatTime(start)}–${formatTime(end)}`
    })
    .join(', ')

  const locations = shifts
    .map((shift) => shift.JobDescription || shift.JobAbbr || shift.UnitDescription)
    .filter((value): value is string => Boolean(value))

  return {
    summary: summary || 'Zmiana przydzielona',
    location: locations.length > 0 ? Array.from(new Set(locations)).join(', ') : '—',
    status,
  }
}

function calendarStatusBadge(date: string): string {
  const info = getScheduledDayInfo(date)
  if (!info || !info.status) return ''
  if (info.status === 'state-0') return '0'
  if (info.status === 'state-1') return '1'
  if (info.status === 'state-2') return '2'
  return ''
}

function isDateSelectable(date: string): boolean {
  const selected = new Date(`${date}T00:00:00`)
  const today = new Date()
  const start = getStartOfWeek(today)
  start.setDate(start.getDate() + 15)
  const end = new Date(start)
  end.setDate(start.getDate() + 365)

  return selected >= start && selected <= end
}

function hasShiftDetails(date: string): boolean {
  const scheduled = getScheduledDayInfo(date)
  return Boolean(scheduled && (props.scheduledShifts.some((day) => day.BusinessDate.slice(0, 10) === date) || props.existingShiftRequests.some((request) => request.BusinessDate.slice(0, 10) === date)))
}

function markerClassForDate(date: string): string {
  const classes = ['calendar-day']
  const scheduledDay = props.scheduledShifts.find((day) => day.BusinessDate.slice(0, 10) === date)
  const hasAssignedShift = Boolean(scheduledDay && (scheduledDay.Shifts?.length ?? 0) > 0)
  const isScheduledFreeDay = Boolean(scheduledDay && (scheduledDay.Shifts?.length ?? 0) === 0)

  if (!isDateSelectable(date)) {
    if (hasAssignedShift) {
      classes.push('calendar-day-readonly', 'calendar-day-scheduled')
      return classes.join(' ')
    }

    if (isScheduledFreeDay) {
      classes.push('calendar-day-readonly', 'calendar-day-free')
      return classes.join(' ')
    }

    if (hasShiftDetails(date)) {
      classes.push('calendar-day-readonly')
      return classes.join(' ')
    }

    classes.push('calendar-day-disabled')
    return classes.join(' ')
  }

  const selected = props.selectedDates.includes(date)
  const request = findRequestForDate(date)

  if (selected) classes.push('selected')
  if (request) {
    const type = request.TypeOfRequest
    if (type === '11111') classes.push('marker-full')
    else if (type === '00000') classes.push('marker-off')
    else if (type.startsWith('<')) classes.push('marker-before')
    else if (type.startsWith('>')) classes.push('marker-after')
    else classes.push('marker-hours')
  }
  if (date === props.requestDate && !selected) classes.push('single-selected')

  return classes.join(' ')
}

function calendarRequestLabel(date: string): string {
  const request = findRequestForDate(date)
  return request ? formatCompactRequestLabel(request.TypeOfRequest) : ''
}

function shiftVisibleMonth(delta: number): void {
  const next = new Date(visibleMonth.value)
  next.setMonth(next.getMonth() + delta)
  visibleMonth.value = next
}

const calendarMonthBlocks = computed(() => {
  const monthStart = new Date(visibleMonth.value.getFullYear(), visibleMonth.value.getMonth(), 1)
  const monthEnd = new Date(visibleMonth.value.getFullYear(), visibleMonth.value.getMonth() + 1, 0, 23, 59, 59, 999)

  const dates: Array<{ value: string; selectable: boolean }> = []
  const cursor = new Date(monthStart)

  while (cursor <= monthEnd) {
    const iso = cursor.toISOString().slice(0, 10)
    dates.push({ value: iso, selectable: isDateSelectable(iso) })
    cursor.setDate(cursor.getDate() + 1)
  }

  const nextMonthStart = new Date(visibleMonth.value.getFullYear(), visibleMonth.value.getMonth() + 1, 1)
  const nextMonthEnd = new Date(nextMonthStart)
  nextMonthEnd.setMonth(nextMonthStart.getMonth() + 1)
  nextMonthEnd.setDate(0)

  const nextMonthDates: Array<{ value: string; selectable: boolean }> = []
  if (dates.length < 28) {
    const cursorNext = new Date(nextMonthStart)
    while (cursorNext <= nextMonthEnd) {
      const iso = cursorNext.toISOString().slice(0, 10)
      nextMonthDates.push({ value: iso, selectable: isDateSelectable(iso) })
      cursorNext.setDate(cursorNext.getDate() + 1)
    }
  }

  return [
    { label: monthStart.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' }), dates, showDivider: false },
    ...(nextMonthDates.length > 0 ? [{ label: nextMonthStart.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' }), dates: nextMonthDates, showDivider: true }] : []),
  ]
})

function selectCalendarDate(date: string): void {
  if (!isDateSelectable(date)) {
    if (hasShiftDetails(date)) {
      emit('open-shift-details', date)
      return
    }
    return
  }

  if (props.existingShiftRequests.some((request) => request.BusinessDate.slice(0, 10) === date)) return
  emit('toggle-date', date)
}

function handleCalendarCellClick(date: string, selectable: boolean): void {
  if (selectable) {
    selectCalendarDate(date)
    return
  }

  if (hasShiftDetails(date)) {
    emit('open-shift-details', date)
  }
}
</script>

<template>
  <div class="calendar-panel">
    <div class="calendar-header">
      <strong>Wybierz daty</strong>
      <div class="legend">
        <span><i class="legend-dot full"></i> Cały dzień</span>
        <span><i class="legend-dot off"></i> Dzień wolny</span>
        <span><i class="legend-dot hours"></i> Godziny</span>
        <span><i class="legend-dot before"></i> Od godz.</span>
        <span><i class="legend-dot after"></i> Do godz.</span>
      </div>
    </div>

    <div class="calendar-navigation">
      <button type="button" class="nav-button" @click="shiftVisibleMonth(-1)" aria-label="Poprzedni miesiąc">←</button>
      <strong>{{ visibleMonth.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' }) }}</strong>
      <button type="button" class="nav-button" @click="shiftVisibleMonth(1)" aria-label="Następny miesiąc">→</button>
    </div>

    <div v-for="monthBlock in calendarMonthBlocks" :key="monthBlock.label" class="calendar-month-block">
      <div class="calendar-month-label">
        {{ monthBlock.label }}
        <span v-if="monthBlock.showDivider" class="month-divider-tag">kolejny miesiąc</span>
      </div>

      <div class="calendar-weekdays">
        <span>Pn</span>
        <span>Wt</span>
        <span>Śr</span>
        <span>Cz</span>
        <span>Pt</span>
        <span>So</span>
        <span>Nd</span>
      </div>

      <div class="calendar-grid">
        <button
          v-for="day in monthBlock.dates"
          :key="day.value"
          type="button"
          :class="[
            markerClassForDate(day.value),
            !day.selectable && hasShiftDetails(day.value) ? 'calendar-day-readonly' : '',
            !day.selectable && !hasShiftDetails(day.value) ? 'calendar-day-blocked' : '',
          ]"
          :aria-disabled="!day.selectable && !hasShiftDetails(day.value)"
          :data-selected="day.value === props.requestDate"
          @click="handleCalendarCellClick(day.value, day.selectable)"
        >
          <span v-if="calendarStatusBadge(day.value)" class="calendar-day-status">{{ calendarStatusBadge(day.value) }}</span>
          <span class="calendar-day-number">{{ new Date(day.value).getDate() }}</span>

          <template v-if="!day.selectable">
            <span v-if="getScheduledDayInfo(day.value)" class="calendar-day-meta">
              {{ getScheduledDayInfo(day.value)?.summary ?? '' }}
            </span>
            <span v-if="getScheduledDayInfo(day.value)?.location" class="calendar-day-location">
              {{ getScheduledDayInfo(day.value)?.location }}
            </span>
          </template>

          <span v-else-if="calendarRequestLabel(day.value)" class="calendar-day-meta">{{ calendarRequestLabel(day.value) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-panel {
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 24px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.28);
  /* padding: 24px; */
  color: #e2e8f0;
}

.calendar-header,
.calendar-navigation,
.calendar-month-label,
.calendar-weekdays,
.calendar-grid {
  display: grid;
}

.calendar-header {
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 0.78rem;
  color: #cbd5e1;
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  margin-right: 6px;
}

.legend-dot.full { background: #60a5fa; }
.legend-dot.off { background: #22c55e; }
.legend-dot.hours { background: #f59e0b; }
.legend-dot.before { background: #f87171; }
.legend-dot.after { background: #a78bfa; }

.calendar-navigation {
  grid-template-columns: 42px 1fr 42px;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.nav-button {
  border: none;
  border-radius: 12px;
  background: rgba(148, 163, 184, 0.12);
  color: white;
  width: 42px;
  height: 42px;
  font-size: 1.1rem;
  cursor: pointer;
}

.calendar-month-block {
  margin-top: 16px;
}

.calendar-month-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 700;
  color: white;
  text-transform: capitalize;
}

.month-divider-tag {
  font-size: 0.7rem;
  color: #cbd5e1;
  background: rgba(148, 163, 184, 0.12);
  padding: 4px 8px;
  border-radius: 999px;
}

.calendar-weekdays {
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.8rem;
  color: #cbd5e1;
}

.calendar-weekdays span {
  text-align: center;
}

.calendar-grid {
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 2px;
}

.calendar-day {
  position: relative;
  min-height: 92px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.56);
  color: white;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  text-align: left;
  cursor: pointer;
}

.calendar-day-number {
  font-size: 0.9rem;
  font-weight: 700;
}

.calendar-day-meta,
.calendar-day-location {
  font-size: 0.63rem;
  line-height: 1.2;
  margin-top: 4px;
}

.calendar-day-location { color: #cbd5e1; }

.calendar-day-status {
  position: absolute;
  top: 5px;
  right: 7px;
  font-size: 0.7rem;
  font-weight: 800;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.15);
  display: grid;
  place-items: center;
}

.calendar-day-disabled { opacity: 0.5; cursor: not-allowed; }
.calendar-day-readonly { background: rgba(59, 130, 246, 0.12); }
.calendar-day-scheduled { border-color: rgba(96, 165, 250, 0.55); }
.calendar-day-free { border-color: rgba(34, 197, 94, 0.55); }
.selected { box-shadow: inset 0 0 0 2px #a78bfa; }
.marker-full { background: rgba(96, 165, 250, 0.2); }
.marker-off { background: rgba(34, 197, 94, 0.18); }
.marker-before { background: rgba(248, 113, 113, 0.12); }
.marker-after { background: rgba(167, 139, 250, 0.12); }
.marker-hours { background: rgba(245, 158, 11, 0.12); }
.single-selected { border-style: dashed; }
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ShiftDay, ShiftRequest } from '../api/types'
import type { QueuedRequest } from '../composables/useShiftRequests'
import {
  apiDateKey,
  daysOfMonth,
  formatMonth,
  formatTime,
  formatWeekdayShort,
  leadingBlankDays,
  startOfMonth,
  toDateKey,
} from '../domain/dates'
import { decodeKind, describeRequest } from '../domain/requests'

const props = defineProps<{
  shifts: ShiftDay[]
  existing: ShiftRequest[]
  queue: QueuedRequest[]
  selected: string[]
  canRequest: (date: string) => boolean
}>()

const emit = defineEmits<{
  toggle: [date: string]
  details: [date: string]
}>()

const month = ref(startOfMonth(new Date()))
const today = toDateKey(new Date())

function shiftMonth(delta: number): void {
  month.value = new Date(month.value.getFullYear(), month.value.getMonth() + delta, 1)
}

type Tile = {
  key: string
  weekday: string
  day: number
  shift: string | null
  place: string | null
  request: string | null
  requestCode: string | null
  state: number | null
  queued: boolean
  selected: boolean
  requestable: boolean
  hasShift: boolean
}

const shiftsByDay = computed(() => new Map(props.shifts.map((day) => [apiDateKey(day.BusinessDate), day])))
const existingByDay = computed(() => new Map(props.existing.map((r) => [apiDateKey(r.BusinessDate), r])))
const queuedByDay = computed(() => new Map(props.queue.map((q) => [q.date, q])))

const blanks = computed(() => leadingBlankDays(month.value))

const tiles = computed<Tile[]>(() =>
  daysOfMonth(month.value).map((date) => {
    const key = toDateKey(date)
    const scheduled = shiftsByDay.value.get(key)
    const existing = existingByDay.value.get(key)
    const queued = queuedByDay.value.get(key)
    const requestCode = existing?.TypeOfRequest ?? queued?.code ?? null
    const dayShifts = scheduled?.Shifts ?? []

    return {
      key,
      weekday: formatWeekdayShort(date),
      day: date.getDate(),
      shift: scheduled
        ? dayShifts.length
          ? dayShifts.map((s) => `${formatTime(s.StartDate)}–${formatTime(s.EndDate)}`).join(', ')
          : 'Wolne'
        : null,
      place: dayShifts.map((s) => s.JobDescription || s.JobAbbr || s.UnitDescription).filter(Boolean).join(', ') || null,
      request: requestCode ? describeRequest(requestCode) : null,
      requestCode,
      state: existing?.State ?? null,
      queued: Boolean(queued),
      selected: props.selected.includes(key),
      requestable: props.canRequest(key),
      hasShift: dayShifts.length > 0,
    }
  }),
)

function tileClass(tile: Tile): Record<string, boolean> {
  const kind = tile.requestCode ? decodeKind(tile.requestCode) : null
  return {
    tile: true,
    today: tile.key === today,
    selected: tile.selected,
    queued: tile.queued,
    requestable: tile.requestable,
    inactive: !tile.requestable && !tile.hasShift && !tile.request,
    [`kind-${kind?.toLowerCase().replace('_', '-')}`]: Boolean(kind),
  }
}

function onClick(tile: Tile): void {
  if (tile.requestable) emit('toggle', tile.key)
  else if (tile.hasShift) emit('details', tile.key)
}
</script>

<template>
  <section class="card calendar">
    <div class="nav">
      <button class="button icon" type="button" aria-label="Poprzedni miesiąc" @click="shiftMonth(-1)">←</button>
      <strong>{{ formatMonth(month) }}</strong>
      <button class="button icon" type="button" aria-label="Następny miesiąc" @click="shiftMonth(1)">→</button>
    </div>

    <div class="legend">
      <span><i class="dot kind-full-day"></i>Cały dzień</span>
      <span><i class="dot kind-off-day"></i>Wolne</span>
      <span><i class="dot kind-work-hours"></i>Godziny</span>
      <span><i class="dot kind-not-before"></i>Od godz.</span>
      <span><i class="dot kind-not-after"></i>Do godz.</span>
    </div>

    <div class="grid">
      <div v-for="n in blanks" :key="`blank-${n}`" class="blank"></div>

      <button v-for="tile in tiles" :key="tile.key" type="button" :class="tileClass(tile)" @click="onClick(tile)">
        <span class="head">
          <span class="weekday">{{ tile.weekday }}</span>
          <strong>{{ tile.day }}</strong>
        </span>
        <span v-if="tile.state !== null" class="state" title="Status wniosku">{{ tile.state }}</span>
        <span v-if="tile.shift" class="line">{{ tile.shift }}</span>
        <span v-if="tile.place" class="line muted">{{ tile.place }}</span>
        <span v-if="tile.request" class="line">{{ tile.queued ? '⏳ ' : '' }}{{ tile.request }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.nav {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  text-align: center;
  text-transform: capitalize;
  gap: 12px;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 12px 0;
  font-size: 0.78rem;
  color: var(--muted);
}

.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 6px;
  border-radius: 999px;
  background: var(--marker);
}

.grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}

.tile {
  position: relative;
  min-height: 84px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  text-align: left;
  color: var(--text);
  font-size: 0.7rem;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-left: 4px solid var(--marker, var(--border));
  border-radius: 10px;
  cursor: default;
  overflow: hidden;
}

.tile.requestable {
  cursor: pointer;
}

.tile.inactive {
  opacity: 0.45;
}

.tile.today {
  border-color: var(--text);
}

.tile.selected {
  box-shadow: inset 0 0 0 2px var(--purple);
}

.tile.queued {
  border-style: dashed;
}

.head {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.head strong {
  font-size: 0.95rem;
}

.weekday {
  color: var(--muted);
  text-transform: capitalize;
}

.line {
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.state {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--surface-1);
  font-weight: 700;
}

.kind-full-day { --marker: var(--blue); }
.kind-off-day { --marker: var(--green); }
.kind-work-hours { --marker: var(--amber); }
.kind-not-before { --marker: var(--red); }
.kind-not-after { --marker: var(--purple); }

@media (max-width: 520px) {
  .tile {
    min-height: 64px;
    padding: 4px;
    font-size: 0.6rem;
  }

  .muted {
    display: none;
  }
}
</style>

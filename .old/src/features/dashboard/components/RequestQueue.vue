<script setup lang="ts">
import type { ExistingShiftRequest, ShiftRequestPayload, ShiftRequestResult } from '../../../types'

const props = defineProps<{
  existingShiftRequests: ExistingShiftRequest[]
  requestQueue: ShiftRequestPayload[]
  requestResults: ShiftRequestResult[]
  requestWeeks: Array<{ key: string; label: string; requests: ExistingShiftRequest[] }>
  visibleRequestWeek: { key: string; label: string; requests: ExistingShiftRequest[] } | null
  currentRequestWeekIndex: number
}>()

const emit = defineEmits<{
  'remove-existing-request': [value: string]
  'remove-request': [index: number]
  'remove-result': [index: number]
  'shift-request-week': [delta: number]
}>()

function formatDateWithWeekday(date: string): string {
  const parsed = new Date(`${date}T00:00:00`)
  return parsed.toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

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

function isRequestLockedForRemoval(_date: string): boolean {
  return false
}
</script>

<template>
  <div class="request-list-stack">
    <div v-if="props.existingShiftRequests.length" class="request-list-box">
      <div class="request-week-header">
        <h3>Twoje obecne wnioski</h3>
        <div v-if="props.requestWeeks.length > 1" class="request-week-nav">
          <button type="button" class="tiny-button" :disabled="props.currentRequestWeekIndex === 0" @click="emit('shift-request-week', -1)">←</button>
          <span>{{ props.visibleRequestWeek?.label ?? '' }}</span>
          <button type="button" class="tiny-button" :disabled="props.currentRequestWeekIndex >= props.requestWeeks.length - 1" @click="emit('shift-request-week', 1)">→</button>
        </div>
      </div>

      <ul v-if="props.visibleRequestWeek">
        <li v-for="request in props.visibleRequestWeek.requests" :key="`${request.BusinessDate}-${request.TypeOfRequest}`">
          <div>
            <strong>{{ formatDateWithWeekday(request.BusinessDate.slice(0, 10)) }}</strong>
            <span>{{ formatRequestSummary(request.TypeOfRequest) }}</span>
          </div>
          <button
            type="button"
            class="tiny-button"
            :disabled="isRequestLockedForRemoval(request.BusinessDate.slice(0, 10))"
            @click="emit('remove-existing-request', request.BusinessDate.slice(0, 10))"
          >
            {{ isRequestLockedForRemoval(request.BusinessDate.slice(0, 10)) ? 'Zablokowane' : 'Usuń' }}
          </button>
        </li>
      </ul>
    </div>

    <div v-if="props.requestQueue.length" class="request-list-box">
      <h3>Lista oczekujących</h3>
      <ul>
        <li v-for="(request, index) in props.requestQueue" :key="`${request.BusinessDate}-${request.TypeOfRequest}-${index}`">
          <div>
            <strong>{{ formatDateWithWeekday(request.BusinessDate.slice(0, 10)) }}</strong>
            <span>{{ formatRequestSummary(request.TypeOfRequest) }}</span>
          </div>
          <button type="button" class="tiny-button" @click="emit('remove-request', index)">Usuń</button>
        </li>
      </ul>
    </div>

    <div v-if="props.requestResults.length" class="request-list-box success-box">
      <h3>Status wysyłki</h3>
      <ul>
        <li v-for="(result, index) in props.requestResults" :key="`${result.date}-${index}`">
          <div>
            <strong>{{ result.date }}</strong>
            <span :class="result.success ? 'success' : 'error'">{{ result.message }}</span>
          </div>
          <button type="button" class="tiny-button" @click="emit('remove-result', index)">Usuń</button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.request-list-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.request-list-box {
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  padding: 18px;
  color: #e2e8f0;
}

.request-week-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.request-week-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #cbd5e1;
  font-size: 0.8rem;
}

h3 {
  margin: 0;
  color: white;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(148, 163, 184, 0.06);
}

li strong,
li span {
  display: block;
}

li span {
  color: #cbd5e1;
  font-size: 0.78rem;
}

.tiny-button {
  border: none;
  background: rgba(148, 163, 184, 0.12);
  color: white;
  border-radius: 10px;
  padding: 7px 10px;
  cursor: pointer;
}

.tiny-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.success { color: #86efac; }
.error { color: #fca5a5; }
</style>

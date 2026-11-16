<script setup lang="ts">
import type { ShiftRequest } from '../api/types'
import type { QueuedRequest, SendResult } from '../composables/useShiftRequests'
import { apiDateKey, formatLongDate, isInRange, requestWindow } from '../domain/dates'
import { describeRequest } from '../domain/requests'

defineProps<{
  existing: ShiftRequest[]
  queue: QueuedRequest[]
  results: SendResult[]
}>()

const emit = defineEmits<{
  removeExisting: [date: string]
  unqueue: [date: string]
  clearResults: []
}>()

const activeWindow = requestWindow()
const canRemove = (request: ShiftRequest) => isInRange(apiDateKey(request.BusinessDate), activeWindow)
</script>

<template>
  <div class="lists">
    <section v-if="queue.length" class="card">
      <h3>Do wysłania</h3>
      <ul>
        <li v-for="item in queue" :key="item.date">
          <span><strong>{{ formatLongDate(item.date) }}</strong> · {{ describeRequest(item.code) }}</span>
          <button class="button small" type="button" @click="emit('unqueue', item.date)">Usuń</button>
        </li>
      </ul>
    </section>

    <section v-if="results.length" class="card">
      <h3>
        Wynik wysyłki
        <button class="button small" type="button" @click="emit('clearResults')">Ukryj</button>
      </h3>
      <ul>
        <li v-for="result in results" :key="result.date">
          <span><strong>{{ formatLongDate(result.date) }}</strong> · <span :class="result.ok ? 'ok' : 'error'">{{ result.message }}</span></span>
        </li>
      </ul>
    </section>

    <section v-if="existing.length" class="card">
      <h3>Twoje wnioski</h3>
      <ul>
        <li v-for="request in existing" :key="apiDateKey(request.BusinessDate)">
          <span>
            <strong>{{ formatLongDate(apiDateKey(request.BusinessDate)) }}</strong> · {{ describeRequest(request.TypeOfRequest) }}
          </span>
          <button
            v-if="canRemove(request)"
            class="button small"
            type="button"
            @click="emit('removeExisting', apiDateKey(request.BusinessDate))"
          >
            Usuń
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.lists {
  display: grid;
  gap: 12px;
}

h3 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 8px;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
  max-height: 320px;
  overflow-y: auto;
}

li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  background: var(--surface-2);
}

.ok {
  color: var(--green);
}
</style>

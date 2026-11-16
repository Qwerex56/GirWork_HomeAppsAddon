<script setup lang="ts">
import { ref } from 'vue'
import { formatDate, freezeWindow } from '../domain/dates'
import { kindNeedsTime, REQUEST_KINDS, type RequestKind } from '../domain/requests'

defineProps<{
  selectedCount: number
  queueCount: number
  isSending: boolean
  error: string
}>()

const emit = defineEmits<{
  queue: [kind: RequestKind, start: string, end: string]
  clearSelection: []
  send: []
}>()

const kind = ref<RequestKind>('FULL_DAY')
const start = ref('09:00')
const end = ref('15:00')

const freeze = freezeWindow()
</script>

<template>
  <section class="card form">
    <div>
      <h2>Wniosek o zmianę</h2>
      <p class="muted">Najbliższy okres zamrożenia: {{ formatDate(freeze.start) }} – {{ formatDate(freeze.end) }}</p>
    </div>

    <label class="field">
      <span>Typ</span>
      <select v-model="kind">
        <option v-for="option in REQUEST_KINDS" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
    </label>

    <div v-if="kindNeedsTime(kind)" class="times">
      <label v-if="kind !== 'NOT_AFTER'" class="field">
        <span>Od</span>
        <input v-model="start" type="time" />
      </label>
      <label v-if="kind !== 'NOT_BEFORE'" class="field">
        <span>Do</span>
        <input v-model="end" type="time" />
      </label>
    </div>

    <div class="actions">
      <button class="button primary" type="button" :disabled="selectedCount === 0" @click="emit('queue', kind, start, end)">
        Dodaj do kolejki ({{ selectedCount }})
      </button>
      <button class="button" type="button" :disabled="selectedCount === 0" @click="emit('clearSelection')">
        Wyczyść wybór
      </button>
      <button class="button primary" type="button" :disabled="isSending || queueCount === 0" @click="emit('send')">
        {{ isSending ? 'Wysyłanie…' : `Wyślij wnioski (${queueCount})` }}
      </button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
  </section>
</template>

<style scoped>
.form {
  display: grid;
  gap: 12px;
}

h2 {
  margin: 0 0 4px;
}

.times {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>

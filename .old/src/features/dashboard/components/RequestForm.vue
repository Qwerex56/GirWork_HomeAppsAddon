<script setup lang="ts">
import type { ShiftRequestType } from '../../../types'

const props = defineProps<{
  requestType: ShiftRequestType
  requestStartTime: string
  requestEndTime: string
  selectedDates: string[]
  requestQueue: Array<{ BusinessDate: string; TypeOfRequest: string }>
  requestError: string
  isSubmittingRequests: boolean
}>()

const emit = defineEmits<{
  'update:request-type': [value: ShiftRequestType]
  'update:request-start-time': [value: string]
  'update:request-end-time': [value: string]
  'add-request-type': [value: ShiftRequestType]
  'clear-selection': []
  'submit-requests': []
}>()

const typeOptions: Array<{ value: ShiftRequestType; label: string }> = [
  { value: 'FULL_DAY', label: 'Dzień pracujący' },
  { value: 'OFF_DAY', label: 'Dzień wolny' },
  { value: 'WORK_HOURS', label: 'Godziny pracy' },
  { value: 'NOT_BEFORE', label: 'Nie pracuję przed godziną' },
  { value: 'NOT_AFTER', label: 'Nie pracuję po godzinie' },
]
</script>

<template>
  <section class="request-panel">
    <div class="panel-header">
      <h2>Wniosek o zmianę</h2>
      <p class="panel-subtitle">Najbliższy okres zamrożenia wniosków: {{ $attrs.freezeWindowLabel }}</p>
    </div>

    <div class="request-form-grid">
      <label>
        <span>Wybierz typ zmiany</span>
        <select :value="props.requestType" @change="emit('update:request-type', ($event.target as HTMLSelectElement).value as ShiftRequestType)">
          <option v-for="option in typeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
    </div>

    <div v-if="props.requestType === 'WORK_HOURS' || props.requestType === 'NOT_BEFORE' || props.requestType === 'NOT_AFTER'" class="request-form-grid compact-grid">
      <label>
        <span>Od</span>
        <input :value="props.requestStartTime" type="time" @input="emit('update:request-start-time', ($event.target as HTMLInputElement).value)" />
      </label>

      <label>
        <span>Do</span>
        <input :value="props.requestEndTime" type="time" @input="emit('update:request-end-time', ($event.target as HTMLInputElement).value)" />
      </label>
    </div>

    <div class="request-actions">
      <button class="primary-button" type="button" :disabled="props.selectedDates.length === 0" @click="emit('add-request-type', props.requestType)">
        Dodaj do kolejki
      </button>
      <button class="secondary-button" type="button" :disabled="props.selectedDates.length === 0" @click="emit('clear-selection')">
        Wyczyść wybór
      </button>
      <button class="primary-button" type="button" :disabled="props.isSubmittingRequests || props.requestQueue.length === 0" @click="emit('submit-requests')">
        {{ props.isSubmittingRequests ? 'Wysyłanie...' : 'Wyślij wnioski' }}
      </button>
    </div>

    <p v-if="props.requestError" class="request-error">{{ props.requestError }}</p>
  </section>
</template>

<style scoped>
.request-panel {
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 24px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.28);
  padding: 24px;
}

.panel-header {
  margin-bottom: 18px;
}

h2 {
  margin: 0;
  color: white;
}

.panel-subtitle {
  margin: 8px 0 0;
  color: #cbd5e1;
  font-size: 0.88rem;
}

.request-form-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.compact-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #cbd5e1;
  font-size: 0.9rem;
}

input,
select {
  background: rgba(148, 163, 184, 0.08);
  color: white;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 12px;
  padding: 12px 14px;
}

.request-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.primary-button,
.secondary-button {
  border: none;
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 700;
  cursor: pointer;
}

.primary-button {
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  color: white;
}

.secondary-button {
  background: rgba(99, 102, 241, 0.18);
  color: white;
}

.primary-button:disabled,
.secondary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.request-error {
  margin: 16px 0 0;
  color: #fca5a5;
  font-size: 0.88rem;
}
</style>

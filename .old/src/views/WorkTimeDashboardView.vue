<script setup lang="ts">
import DashboardView from '../features/dashboard/components/DashboardView.vue'
import LoginForm from '../features/auth/components/LoginForm.vue'
import type { DashboardViewProps } from '../features/dashboard/types/dashboard'
import type { ShiftRequestType } from '../types'

const props = defineProps<DashboardViewProps & {
  email: string
  password: string
  errorMessage: string
  isLoading: boolean
  isAuthenticated: boolean
}>()

const emit = defineEmits<{
  (event: 'update:email', value: string): void
  (event: 'update:password', value: string): void
  (event: 'login'): void
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
</script>

<template>
  <main class="app-shell">
    <LoginForm
      v-if="!props.isAuthenticated"
      :email="props.email"
      :password="props.password"
      :error-message="props.errorMessage"
      :is-loading="props.isLoading"
      @update:email="emit('update:email', $event)"
      @update:password="emit('update:password', $event)"
      @login="emit('login')"
    />

    <DashboardView
      v-else
      :month-actual-hours="props.monthActualHours"
      :month-predicted-hours="props.monthPredictedHours"
      :previous-month-actual-hours="props.previousMonthActualHours"
      :week-actual-hours="props.weekActualHours"
      :week-predicted-hours="props.weekPredictedHours"
      :month-earnings="props.monthEarnings"
      :previous-month-earnings="props.previousMonthEarnings"
      :week-earnings="props.weekEarnings"
      :last-updated-text="props.lastUpdatedText"
      :employee-id="props.employeeId"
      :request-date="props.requestDate"
      :request-type="props.requestType"
      :request-start-time="props.requestStartTime"
      :request-end-time="props.requestEndTime"
      :selected-dates="props.selectedDates"
      :existing-shift-requests="props.existingShiftRequests"
      :scheduled-shifts="props.scheduledShifts"
      :request-queue="props.requestQueue"
      :request-results="props.requestResults"
      :shift-details="props.shiftDetails"
      :shift-details-date="props.shiftDetailsDate"
      :is-shift-details-open="props.isShiftDetailsOpen"
      :is-shift-details-loading="props.isShiftDetailsLoading"
      :request-error="props.requestError"
      :is-submitting-requests="props.isSubmittingRequests"
      @refresh="emit('refresh')"
      @logout="emit('logout')"
      @update:employee-id="emit('update:employee-id', $event)"
      @update:request-date="emit('update:request-date', $event)"
      @update:request-type="emit('update:request-type', $event)"
      @update:request-start-time="emit('update:request-start-time', $event)"
      @update:request-end-time="emit('update:request-end-time', $event)"
      @add-request="emit('add-request')"
      @add-request-type="emit('add-request-type', $event)"
      @toggle-date="emit('toggle-date', $event)"
      @clear-selection="emit('clear-selection')"
      @remove-existing-request="emit('remove-existing-request', $event)"
      @submit-requests="emit('submit-requests')"
      @remove-request="emit('remove-request', $event)"
      @remove-result="emit('remove-result', $event)"
      @open-shift-details="emit('open-shift-details', $event)"
      @close-shift-details="emit('close-shift-details')"
    />
  </main>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 18px 12px;
}

@media (max-width: 430px) {
  .app-shell {
    padding: 12px 8px;
  }
}
</style>

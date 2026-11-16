<script setup lang="ts">
import { onMounted } from 'vue'
import { useSession } from '../composables/useSession'
import { useShiftDetails } from '../composables/useShiftDetails'
import { useShiftRequests } from '../composables/useShiftRequests'
import { useWorkTime } from '../composables/useWorkTime'
import CalendarGrid from './CalendarGrid.vue'
import RequestForm from './RequestForm.vue'
import RequestLists from './RequestLists.vue'
import ShiftDetailsModal from './ShiftDetailsModal.vue'
import SummaryCards from './SummaryCards.vue'

const { logout } = useSession()
const workTime = useWorkTime()
const requests = useShiftRequests()
const shiftDetails = useShiftDetails()

function refresh(): Promise<unknown> {
  return Promise.all([workTime.load(), requests.load()])
}

onMounted(refresh)
</script>

<template>
  <div class="dashboard">
    <header class="topbar">
      <div>
        <p class="eyebrow">GIR Work Time Counter</p>
        <h1>Podsumowanie</h1>
      </div>
      <div class="actions">
        <button class="button" type="button" :disabled="workTime.isLoading.value" @click="refresh">
          {{ workTime.isLoading.value ? 'Odświeżanie…' : 'Odśwież' }}
        </button>
        <button class="button ghost" type="button" @click="logout">Wyloguj</button>
      </div>
    </header>

    <p v-if="workTime.error.value" class="error">{{ workTime.error.value }}</p>

    <SummaryCards
      :month="workTime.month.value"
      :week="workTime.week.value"
      :previous-month="workTime.previousMonth.value"
    />

    <RequestForm
      :selected-count="requests.selected.value.length"
      :queue-count="requests.queue.value.length"
      :is-sending="requests.isSending.value"
      :error="requests.error.value"
      @queue="requests.queueSelected"
      @clear-selection="requests.clearSelection"
      @send="requests.sendQueue"
    />

    <CalendarGrid
      :shifts="workTime.shifts.value"
      :existing="requests.existing.value"
      :queue="requests.queue.value"
      :selected="requests.selected.value"
      :can-request="requests.canRequest"
      @toggle="requests.toggleDate"
      @details="shiftDetails.open"
    />

    <RequestLists
      :existing="requests.existing.value"
      :queue="requests.queue.value"
      :results="requests.results.value"
      @remove-existing="requests.removeExisting"
      @unqueue="requests.unqueue"
      @clear-results="requests.clearResults"
    />

    <p v-if="workTime.lastUpdated.value" class="muted updated">Ostatnia aktualizacja: {{ workTime.lastUpdated.value }}</p>

    <ShiftDetailsModal
      v-if="shiftDetails.date.value"
      :date="shiftDetails.date.value"
      :details="shiftDetails.details.value"
      :is-loading="shiftDetails.isLoading.value"
      :error="shiftDetails.error.value"
      @close="shiftDetails.close"
    />
  </div>
</template>

<style scoped>
.dashboard {
  display: grid;
  gap: 16px;
}

.topbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

h1 {
  margin: 0;
}

.actions {
  display: flex;
  gap: 8px;
}

.updated {
  text-align: center;
  font-size: 0.8rem;
}
</style>

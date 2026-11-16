<script setup lang="ts">
import type { ShiftDetailDay } from '../../../types'
import { displayInitials, displayRosterName, inferManagerStatus, type ShiftRosterPerson } from '../composables/useShiftRoster'

const props = defineProps<{
  isOpen: boolean
  shiftDetailsDate: string | null
  shiftDetails: ShiftDetailDay[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  'close-shift-details': []
}>()

function sortedColleagues(colleagues: ShiftRosterPerson[]) {
  return [...colleagues].sort((left, right) => {
    const leftManager = inferManagerStatus(left).isManager ? 0 : 1
    const rightManager = inferManagerStatus(right).isManager ? 0 : 1
    if (leftManager !== rightManager) return leftManager - rightManager
    return displayRosterName(left).localeCompare(displayRosterName(right), 'pl')
  })
}
</script>

<template>
  <div v-if="props.isOpen" class="modal-backdrop" @click="emit('close-shift-details')">
    <div class="modal-card" @click.stop>
      <div class="modal-header">
        <h3>{{ props.shiftDetailsDate ? new Date(`${props.shiftDetailsDate}T00:00:00`).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Szczegóły zmiany' }}</h3>
        <button type="button" class="tiny-button" @click="emit('close-shift-details')">Zamknij</button>
      </div>

      <div v-if="props.isLoading" class="modal-loading">Ładowanie szczegółów...</div>

      <div v-else-if="props.shiftDetails.length === 0" class="modal-empty">Brak szczegółów dla tego dnia.</div>

      <div v-else class="modal-content">
        <div v-for="item in props.shiftDetails" :key="item.Id" class="shift-detail-item">
          <div class="detail-row">
            <span>Zakres</span>
            <strong>{{ new Date(item.StartDate).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', hour12: false }) }}–{{ new Date(item.EndDate).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', hour12: false }) }}</strong>
          </div>
          <div class="detail-row">
            <span>Stanowisko</span>
            <strong>{{ item.UnitDescription || '—' }}</strong>
          </div>

          <div v-if="item.Colleagues?.length" class="colleagues-list">
            <div class="colleagues-header">
              <h4>Osoby na zmianie</h4>
              <small>To tylko prognoza — może być inaczej.</small>
            </div>

            <div
              v-for="colleague in sortedColleagues(item.Colleagues)"
              :key="colleague.Id"
              :class="inferManagerStatus(colleague).isManager ? 'colleague-row manager-row' : 'colleague-row employee-row'"
            >
              <div class="colleague-ident">
                <span v-if="colleague.Image" class="colleague-avatar" :style="`background-image: url('${colleague.Image}')`"></span>
                <span v-else class="colleague-avatar initials">{{ displayInitials(colleague) }}</span>
              </div>
              <div class="colleague-text">
                <div class="colleague-row-header">
                  <strong>{{ displayRosterName(colleague) }}</strong>
                  <span v-if="inferManagerStatus(colleague).isManager" class="manager-badge">{{ inferManagerStatus(colleague).label }}</span>
                </div>
                <small>{{ colleague.ShiftStart ? new Date(colleague.ShiftStart).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', hour12: false }) : '' }}–{{ colleague.ShiftEnd ? new Date(colleague.ShiftEnd).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', hour12: false }) : '' }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  display: grid;
  place-items: center;
  z-index: 30;
}

.modal-card {
  width: min(92vw, 760px);
  max-height: 80vh;
  overflow: auto;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 24px;
  padding: 20px;
  color: white;
}

.modal-header,
.colleague-row-header,
.detail-row,
.colleagues-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.modal-header {
  margin-bottom: 12px;
}

h3,
h4 {
  margin: 0;
}

.tiny-button {
  border: none;
  background: rgba(148, 163, 184, 0.12);
  color: white;
  border-radius: 10px;
  padding: 7px 10px;
  cursor: pointer;
}

.shift-detail-item {
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 16px;
  padding: 14px;
  margin-top: 12px;
  background: rgba(148, 163, 184, 0.03);
}

.detail-row {
  padding: 6px 0;
  color: #cbd5e1;
}

.colleagues-list {
  margin-top: 18px;
}

.colleagues-header {
  margin-bottom: 10px;
}

.colleague-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  margin-top: 8px;
}

.manager-row { background: rgba(167, 139, 250, 0.12); }
.employee-row { background: rgba(96, 165, 250, 0.08); }

.colleague-ident { display: flex; align-items: center; }

.colleague-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(148, 163, 184, 0.18);
  font-size: 0.8rem;
  font-weight: 700;
}

.colleague-text {
  flex: 1;
}

.manager-badge {
  background: rgba(167, 139, 250, 0.18);
  color: #ddd6fe;
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 0.7rem;
}
</style>

<script lang="ts">
let lastPointerY = 0
window.addEventListener('pointerdown', (event) => (lastPointerY = event.pageY), { capture: true })
</script>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { ShiftDetail } from '../api/types'
import { formatLongDate, formatTime } from '../domain/dates'
import { colleagueName, initials, isShiftManager, sortColleagues } from '../domain/roster'

defineProps<{
  date: string
  details: ShiftDetail[]
  isLoading: boolean
  error: string
}>()

const emit = defineEmits<{ close: [] }>()

// Inside HomeApps the frame is as tall as the page and never scrolls, so a centred dialog could open far from the
// clicked day: open it next to where the person clicked and bring it into view.
const dialog = ref<HTMLElement | null>(null)
const top = ref(lastPointerY)
onMounted(() => dialog.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))

const hours = (start?: string | null, end?: string | null) =>
  start && end ? `${formatTime(start)}–${formatTime(end)}` : ''
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <div ref="dialog" class="card modal" role="dialog" aria-modal="true" :style="{ '--top': `${top}px` }">
      <header>
        <h3>{{ formatLongDate(date) }}</h3>
        <button class="button small" type="button" @click="emit('close')">Zamknij</button>
      </header>

      <p v-if="isLoading" class="muted">Ładowanie…</p>
      <p v-else-if="error" class="error">{{ error }}</p>
      <p v-else-if="details.length === 0" class="muted">Brak szczegółów dla tego dnia.</p>

      <template v-else>
        <article v-for="shift in details" :key="shift.Id" class="shift">
          <p><strong>{{ hours(shift.StartDate, shift.EndDate) }}</strong> · {{ shift.UnitDescription || '—' }}</p>
  
          <ul v-if="shift.Colleagues?.length">
            <li v-for="person in sortColleagues(shift.Colleagues)" :key="person.Id" :class="{ manager: isShiftManager(person) }">
              <span class="avatar">
                {{ initials(person) }}
                <img v-if="person.Image" :src="person.Image" alt="" @error="($event.target as HTMLElement).remove()" />
              </span>
              <span class="who">
                <strong>{{ colleagueName(person) }}</strong>
                <small class="muted">{{ hours(person.ShiftStart, person.ShiftEnd) }}</small>
              </span>
              <span v-if="isShiftManager(person)" class="badge">Kierownik zmiany (prognoza)</span>
            </li>
          </ul>
        </article>
      </template>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgb(0 0 0 / 0.6);
}

.modal {
  width: min(560px, 100%);
  max-height: 85vh;
  overflow-y: auto;
}

.in-homemix .backdrop {
  align-items: start;
}

.in-homemix .modal {
  margin-top: max(0px, calc(var(--top) - 160px));
  max-height: none;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

h3 {
  margin: 0;
}

.shift + .shift {
  border-top: 1px solid var(--border);
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
}

li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 8px;
  background: var(--surface-2);
}

li.manager {
  box-shadow: inset 3px 0 0 var(--amber);
}

.avatar {
  flex: none;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: var(--surface-1);
  font-size: 0.75rem;
  font-weight: 700;
  position: relative;
  overflow: hidden;
}

/* The photo covers the initials when it loads; HomeMix's sandbox blocks images from other sites. */
.avatar img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.who {
  display: grid;
  flex: 1;
}

.badge {
  font-size: 0.7rem;
  color: var(--amber);
}
</style>

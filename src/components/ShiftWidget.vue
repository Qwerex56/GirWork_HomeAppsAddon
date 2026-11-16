<script setup lang="ts">
import { HmEmpty, HmList, HmProgress, HmStat, HmWidget, useWidget } from '@home-apps/vue'
import { computed, onMounted } from 'vue'
import { useSession } from '../composables/useSession'
import { useWorkTime } from '../composables/useWorkTime'
import { formatLongDate, formatTime, toDateKey } from '../domain/dates'
import { formatCurrency } from '../domain/hours'

// The "Moje aplikacje" widget, built from HomeMix blocks: Small = this month's hours, Medium adds the plan, the pay
// and the next shift, Large lists the coming shifts. A click opens the add-on's page (HmWidget), where you sign in.
const { token } = useSession()
const workTime = useWorkTime()
const { size } = useWidget()

onMounted(() => {
  if (token.value) workTime.load()
})

const month = computed(() => workTime.month.value)
const hours = computed(() => month.value.actualHours.toFixed(1))

const coming = computed(() => {
  const now = Date.now()
  return workTime.shifts.value
    .flatMap((day) => day.Shifts ?? [])
    .filter((shift) => new Date(shift.EndDate).getTime() > now)
    .sort((a, b) => a.StartDate.localeCompare(b.StartDate))
    .map((shift) => ({
      key: shift.StartDate,
      title: formatLongDate(toDateKey(new Date(shift.StartDate))),
      subtitle: shift.UnitDescription ?? '',
      trailing: `${formatTime(shift.StartDate)}–${formatTime(shift.EndDate)}`,
    }))
})
const next = computed(() => coming.value[0])
</script>

<template>
  <HmWidget title="Czas pracy" icon="⏱">
    <HmEmpty v-if="!token" icon="🔑" text="Zaloguj się do GIR w aplikacji" />
    <HmEmpty v-else-if="workTime.error.value" icon="⚠️" :text="workTime.error.value" />
    <div v-else-if="workTime.isLoading.value && !workTime.lastUpdated.value" class="hm-loading">Wczytuję…</div>
    <div v-else class="hm-stack">
      <div class="hm-row hm-between">
        <HmStat :value="hours" unit="h" label="w tym miesiącu" />
        <HmStat v-if="size !== 'Small'" :value="formatCurrency(month.earnings)" label="zarobione" />
      </div>
      <template v-if="size !== 'Small'">
        <HmProgress
          :value="month.actualHours"
          :max="month.predictedHours || 1"
          :label="`z ${month.predictedHours.toFixed(1)} h zaplanowanych`"
        />
        <p v-if="size === 'Medium'" class="hm-small hm-muted hm-truncate">
          {{ next ? `Następna zmiana: ${next.title}, ${next.trailing}` : 'Brak zaplanowanych zmian' }}
        </p>
        <HmList v-else :items="coming" empty="Brak zaplanowanych zmian" />
      </template>
    </div>
  </HmWidget>
</template>

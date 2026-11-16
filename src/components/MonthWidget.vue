<script setup lang="ts">
import { onMounted } from 'vue'
import { useSession } from '../composables/useSession'
import { useWorkTime } from '../composables/useWorkTime'
import { formatCurrency, formatHours, progress } from '../domain/hours'

// The "Moje aplikacje" widget: this month's hours at a glance. Signing in happens on the add-on's page.
const { token } = useSession()
const workTime = useWorkTime()

onMounted(() => {
  if (token.value) workTime.load()
})
</script>

<template>
  <article class="card widget">
    <p v-if="!token" class="muted">Zaloguj się do GIR na stronie dodatku.</p>
    <p v-else-if="workTime.error.value" class="error">{{ workTime.error.value }}</p>
    <template v-else>
      <header><span>Ten miesiąc</span><strong>{{ formatCurrency(workTime.month.value.earnings) }}</strong></header>
      <p class="hours">
        <strong>{{ formatHours(workTime.month.value.actualHours) }}</strong>
        <span class="muted"> z {{ formatHours(workTime.month.value.predictedHours) }}</span>
      </p>
      <div class="bar">
        <div
          :style="{ width: `${progress(workTime.month.value.actualHours, workTime.month.value.predictedHours) * 100}%` }"
        ></div>
      </div>
    </template>
  </article>
</template>

<style scoped>
header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--muted);
}

header strong {
  color: var(--text);
}

.hours {
  margin: 8px 0 0;
  font-size: 1.5rem;
}

.bar {
  height: 6px;
  margin-top: 10px;
  border-radius: 999px;
  background: var(--surface-2);
  overflow: hidden;
}

.bar div {
  height: 100%;
  background: var(--blue);
}
</style>

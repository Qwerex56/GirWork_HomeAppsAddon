<script setup lang="ts">
import { formatCurrency, formatHours, progress, type PeriodSummary } from '../domain/hours'

defineProps<{
  month: PeriodSummary
  week: PeriodSummary
  previousMonth: PeriodSummary
}>()
</script>

<template>
  <div class="summary">
    <article class="card">
      <header><span>Aktualny miesiąc</span><strong>{{ formatCurrency(month.earnings) }}</strong></header>
      <dl>
        <dt>Przepracowane</dt><dd>{{ formatHours(month.actualHours) }}</dd>
        <dt>Zaplanowane</dt><dd>{{ formatHours(month.predictedHours) }}</dd>
      </dl>
      <div class="bar"><div :style="{ width: `${progress(month.actualHours, month.predictedHours) * 100}%` }"></div></div>
    </article>

    <article class="card">
      <header><span>Aktualny tydzień</span><strong>{{ formatCurrency(week.earnings) }}</strong></header>
      <dl>
        <dt>Przepracowane</dt><dd>{{ formatHours(week.actualHours) }}</dd>
        <dt>Zaplanowane</dt><dd>{{ formatHours(week.predictedHours) }}</dd>
      </dl>
      <div class="bar green"><div :style="{ width: `${progress(week.actualHours, week.predictedHours) * 100}%` }"></div></div>
    </article>

    <article class="card">
      <header><span>Poprzedni miesiąc</span><strong>{{ formatCurrency(previousMonth.earnings) }}</strong></header>
      <dl>
        <dt>Przepracowane</dt><dd>{{ formatHours(previousMonth.actualHours) }}</dd>
      </dl>
    </article>
  </div>
</template>

<style scoped>
.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--muted);
  margin-bottom: 10px;
}

header strong {
  color: var(--text);
}

dl {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 6px;
  margin: 0;
}

dt {
  color: var(--muted);
}

dd {
  margin: 0;
  font-weight: 600;
}

.bar {
  height: 6px;
  margin-top: 12px;
  border-radius: 999px;
  background: var(--surface-2);
  overflow: hidden;
}

.bar div {
  height: 100%;
  background: var(--blue);
}

.bar.green div {
  background: var(--green);
}
</style>

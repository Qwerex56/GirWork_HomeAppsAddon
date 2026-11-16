<script setup lang="ts">
import { formatCurrency, formatHours, percentProgress } from '../../../utils/formatters'

const props = defineProps<{
  monthActualHours: number
  monthPredictedHours: number
  previousMonthActualHours: number
  weekActualHours: number
  weekPredictedHours: number
  monthEarnings: number
  previousMonthEarnings: number
  weekEarnings: number
}>()
</script>

<template>
  <div class="summary-grid">
    <article class="summary-card highlight">
      <div class="card-header">
        <span>Przepracowane i przewidywane godziny</span>
        <strong>{{ formatCurrency(props.monthEarnings) }}</strong>
      </div>

      <div class="metrics-row">
        <div class="metric-box">
          <span>Zarobione</span>
          <strong>{{ formatCurrency(props.monthEarnings) }}</strong>
        </div>
        <div class="metric-box">
          <span>Miesiąc</span>
          <strong>{{ formatHours(props.monthActualHours) }}</strong>
        </div>
      </div>

      <div class="metrics-row">
        <div class="metric-box">
          <span>Tydzień</span>
          <strong>{{ formatHours(props.weekActualHours) }}</strong>
        </div>
        <div class="metric-box">
          <span>Przewidywanie</span>
          <strong>{{ formatHours(props.monthPredictedHours) }}</strong>
        </div>
      </div>
    </article>

    <article class="summary-card">
      <div class="card-header">
        <span>Aktualny miesiąc</span>
        <strong>{{ formatCurrency(props.monthEarnings) }}</strong>
      </div>

      <ul class="data-list">
        <li><span>Przepracowane</span><strong>{{ formatHours(props.monthActualHours) }}</strong></li>
        <li><span>Przewidywane</span><strong>{{ formatHours(props.monthPredictedHours) }}</strong></li>
      </ul>

      <div class="progress-wrap">
        <div
          class="progress-fill"
          :style="{ width: `${percentProgress(props.monthActualHours, props.monthPredictedHours) * 100}%` }"
        ></div>
      </div>
    </article>

    <article class="summary-card">
      <div class="card-header">
        <span>Aktualny tydzień</span>
        <strong>{{ formatCurrency(props.weekEarnings) }}</strong>
      </div>

      <ul class="data-list">
        <li><span>Przepracowane</span><strong>{{ formatHours(props.weekActualHours) }}</strong></li>
        <li><span>Przewidywane</span><strong>{{ formatHours(props.weekPredictedHours) }}</strong></li>
      </ul>

      <div class="progress-wrap">
        <div
          class="progress-fill green"
          :style="{ width: `${percentProgress(props.weekActualHours, props.weekPredictedHours) * 100}%` }"
        ></div>
      </div>
    </article>

    <article class="summary-card">
      <div class="card-header">
        <span>Poprzedni miesiąc</span>
        <strong>{{ formatCurrency(props.previousMonthEarnings) }}</strong>
      </div>

      <ul class="data-list">
        <li><span>Przepracowane</span><strong>{{ formatHours(props.previousMonthActualHours) }}</strong></li>
        <li><span>Zarobione</span><strong>{{ formatCurrency(props.previousMonthEarnings) }}</strong></li>
      </ul>
    </article>
  </div>
</template>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.summary-card {
    display: flex;
    flex-direction: column;

  padding: 0.75rem;
  gap: 0.75rem;
  border-right: 1px solid #353535;
  border-bottom: 1px solid #353535;
}

@media screen and (max-width: 820px) {
    .summary-card {
        border-right: none;
    }
}

@media screen and (min-width: 820px) {
    .summary-card:nth-child(2n) {
        border-right: none;
    }
    
    .summary-card:nth-last-child(-n+2) {
        border-bottom: none;
    }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #e2e8f0;
}

.card-header strong {
  color: #a78bfa;
  font-size: 1rem;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.metric-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 9px;
  border-radius: 12px;
  background: rgba(148, 163, 184, 0.08);
}

.metric-box span,
.data-list span {
  color: #cbd5e1;
  font-size: 0.8rem;
}

.metric-box strong,
.data-list strong {
  color: white;
}

.data-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.data-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.progress-wrap {
  height: 10px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.15);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
}

.progress-fill.green {
  background: linear-gradient(90deg, #22c55e, #4ade80);
}
</style>

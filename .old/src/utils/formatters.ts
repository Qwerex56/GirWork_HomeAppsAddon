export function formatHours(value: number): string {
  return `${value.toFixed(2)} h`
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function percentProgress(actual: number, predicted: number): number {
  if (!predicted || predicted <= 0) return 0
  return Math.min(Math.max(actual / predicted, 0), 1)
}

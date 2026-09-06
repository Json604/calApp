export function roundTo(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function roundCalories(value: number): number {
  return Math.round(value);
}

export function formatKg(value: number): string {
  return `${roundTo(value, 1)} kg`;
}

export function formatKcal(value: number): string {
  return `${Math.round(value).toLocaleString('en-US')} kcal`;
}

export function formatGrams(value: number): string {
  return `${roundTo(value, 0)} g`;
}

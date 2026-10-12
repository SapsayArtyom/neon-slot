/**
 * Деньги считаем с точностью до копейки.
 * Без этого дробные ставки дают в UI значения вида 0.30000000000000004.
 */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

/** Деньги на экране: всегда две цифры после точки, чтобы сумма не «дёргалась». */
export function formatMoney(value: number): string {
  return value.toFixed(2)
}

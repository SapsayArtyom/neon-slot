/**
 * Геометрия игрового поля в «проектных» пикселях.
 * На экране поле масштабируется целиком через раскладку,
 * поэтому эти числа не зависят от разрешения устройства.
 */
export const GRID = {
  /** Барабанов — 5, видимых символов на каждом — 3. Классическая схема 5x3. */
  columns: 5,
  rows: 3,
  cellSize: 170,
  gap: 8,
  /** Отступ от символов до внешней рамки поля. */
  padding: 18,
} as const

/** Ширина области символов без внешней рамки. */
export function gridWidth(): number {
  return GRID.columns * GRID.cellSize + (GRID.columns - 1) * GRID.gap
}

/** Высота области символов без внешней рамки. */
export function gridHeight(): number {
  return GRID.rows * GRID.cellSize + (GRID.rows - 1) * GRID.gap
}

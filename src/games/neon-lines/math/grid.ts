import type { NeonSymbolId } from '../config/symbols'

/** Поле символов: grid[барабан][ряд]. Барабаны слева направо, ряды сверху вниз. */
export type NeonGrid = NeonSymbolId[][]

/** Безопасный доступ к клетке: сразу сообщает об ошибке вместо undefined. */
export function symbolAt(grid: NeonGrid, column: number, row: number): NeonSymbolId {
  const symbol = grid[column]?.[row]
  if (!symbol) throw new Error(`В поле нет клетки [барабан ${column}][ряд ${row}]`)
  return symbol
}

import type { GridCell } from '@sdk'
import { SCATTER, WILD } from '../config/symbols'
import type { NeonGrid } from './grid'

/** Сколько Scatter должно выпасть, чтобы запустить фриспины. */
const FREE_SPINS_TRIGGER = 3

/**
 * Сколько фриспинов выдаётся за триггер.
 *
 * Шесть, а не больше, потому что залипающие Wild накапливаются и каждый
 * следующий фриспин стоит дороже предыдущего: шестой приносит в среднем в
 * восемь раз больше первого. При восьми спинах бонус давал бы 42% всей
 * отдачи, и триггер пришлось бы делать вдвое реже. Расчёт — в rtp.test.ts.
 */
export const FREE_SPINS_AWARDED = 6

/** Scatter считается в любом месте поля, а не только на линиях. */
function countScatters(grid: NeonGrid): number {
  let count = 0

  for (const reel of grid) {
    for (const symbol of reel) {
      if (symbol === SCATTER) count += 1
    }
  }

  return count
}

/** Сколько фриспинов даёт это поле. Ноль — значит триггера не было. */
export function freeSpinsFor(grid: NeonGrid): number {
  return countScatters(grid) >= FREE_SPINS_TRIGGER ? FREE_SPINS_AWARDED : 0
}

/**
 * Накладывает залипшие Wild на свежее поле. Поле меняется на месте.
 * Это и есть sticky wild: клетка, однажды ставшая Wild во фриспинах,
 * остаётся Wild до конца раунда.
 */
export function applyStickyWilds(grid: NeonGrid, sticky: readonly GridCell[]): void {
  for (const cell of sticky) {
    const reel = grid[cell.column]
    if (reel && cell.row < reel.length) reel[cell.row] = WILD
  }
}

/** Все клетки с Wild. Во фриспинах именно они залипают до конца раунда. */
export function findWilds(grid: NeonGrid): GridCell[] {
  const cells: GridCell[] = []

  grid.forEach((reel, column) => {
    reel.forEach((symbol, row) => {
      if (symbol === WILD) cells.push({ column, row })
    })
  })

  return cells
}

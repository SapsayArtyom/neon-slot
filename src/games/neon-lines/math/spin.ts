import { randomInt } from '@sdk'
import { GRID } from '../config/grid'
import { REEL_STRIPS } from '../config/reels'
import type { NeonSymbolId } from '../config/symbols'
import type { NeonGrid } from './grid'

/**
 * Один спин: каждый барабан останавливается в случайной позиции своей ленты,
 * и с этой позиции считываются подряд GRID.rows символов. Лента замкнута в кольцо.
 */
export function spinGrid(random: () => number): NeonGrid {
  return REEL_STRIPS.map((strip) => readWindow(strip, randomInt(random, strip.length)))
}

function readWindow(strip: readonly NeonSymbolId[], start: number): NeonSymbolId[] {
  const window: NeonSymbolId[] = []

  for (let row = 0; row < GRID.rows; row += 1) {
    window.push(strip[(start + row) % strip.length]!)
  }

  return window
}

import { createRandom, shuffle } from '@sdk'
import type { NeonSymbolId } from './symbols'

/** Сколько раз символ встречается на ленте барабана. Частота задаёт частоту выпадения. */
type ReelComposition = Record<NeonSymbolId, number>

/**
 * Состав лент пяти барабанов — вместе с таблицей выплат это вся настройка отдачи.
 * Старшие символы и Wild встречаются реже, младшие карточные — чаще.
 * Длина каждой ленты одинакова (50), поэтому числа читаются как проценты × 2.
 */
const REEL_COMPOSITION: readonly ReelComposition[] = [
  { ten: 9, jack: 9, queen: 8, king: 7, ace: 6, orb: 4, prism: 3, core: 1, wild: 1, scatter: 2 },
  { ten: 9, jack: 8, queen: 8, king: 7, ace: 6, orb: 4, prism: 3, core: 1, wild: 2, scatter: 2 },
  { ten: 8, jack: 8, queen: 8, king: 7, ace: 6, orb: 5, prism: 3, core: 1, wild: 2, scatter: 2 },
  { ten: 9, jack: 8, queen: 8, king: 7, ace: 6, orb: 4, prism: 3, core: 1, wild: 2, scatter: 2 },
  { ten: 9, jack: 9, queen: 8, king: 7, ace: 6, orb: 4, prism: 3, core: 1, wild: 1, scatter: 2 },
]

/**
 * Фиксированный seed перемешивания: лента всегда собирается одинаково,
 * но одинаковые символы не стоят на ней длинными блоками.
 */
const STRIP_SHUFFLE_SEED = 20251009

/** Готовые ленты барабанов — именно по ним крутится и останавливается игра. */
export const REEL_STRIPS: readonly (readonly NeonSymbolId[])[] = REEL_COMPOSITION.map(buildStrip)

function buildStrip(composition: ReelComposition, reelIndex: number): NeonSymbolId[] {
  const strip: NeonSymbolId[] = []

  for (const [symbol, count] of Object.entries(composition) as [NeonSymbolId, number][]) {
    for (let i = 0; i < count; i += 1) strip.push(symbol)
  }

  return shuffle(strip, createRandom(STRIP_SHUFFLE_SEED + reelIndex))
}

/**
 * Случайный символ ленты барабана — ими заполняются клетки во время прокрутки.
 * Здесь годится обычный Math.random: эти символы никогда не становятся
 * результатом спина, их видно только в движении.
 */
export function spinningSymbol(column: number): NeonSymbolId {
  const strip = REEL_STRIPS[column] ?? REEL_STRIPS[0]!
  return strip[Math.floor(Math.random() * strip.length)]!
}

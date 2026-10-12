import { PAYLINES } from '../config/paylines'
import { MIN_MATCH, PAYTABLE } from '../config/paytable'
import { SCATTER, WILD, type NeonSymbolId } from '../config/symbols'
import { symbolAt, type NeonGrid } from './grid'
import { roundMoney } from './money'

/** Выигрыш по одной линии. */
export type LineWin = {
  /** Индекс линии в PAYLINES — по нему игра рисует саму линию на экране. */
  lineIndex: number
  /** Символ, за который заплатили. */
  symbol: NeonSymbolId
  /** Сколько символов подряд совпало: 3, 4 или 5. */
  count: number
  /** Выплата в деньгах. */
  amount: number
}

/**
 * Считает выигрыши по всем линиям.
 *
 * Правила: совпадения считаются слева направо начиная с первого барабана,
 * Wild заменяет любой символ кроме Scatter, Scatter по линиям не платит.
 *
 * `bet` — полная ставка за спин: выплаты в таблице заданы её множителями.
 */
export function evaluateLines(grid: NeonGrid, bet: number): LineWin[] {
  const wins: LineWin[] = []

  PAYLINES.forEach((line, lineIndex) => {
    const win = evaluateOneLine(readLine(grid, line), lineIndex, bet)
    if (win) wins.push(win)
  })

  return wins
}

/** Символы, которые линия пересекает, слева направо. */
function readLine(grid: NeonGrid, line: readonly number[]): NeonSymbolId[] {
  return line.map((row, column) => symbolAt(grid, column, row))
}

function evaluateOneLine(
  symbols: readonly NeonSymbolId[],
  lineIndex: number,
  bet: number,
): LineWin | null {
  let best: LineWin | null = null

  for (const candidate of collectCandidates(symbols)) {
    const count = countFromLeft(symbols, candidate)
    if (count < MIN_MATCH) continue

    const amount = roundMoney(payoutMultiplier(candidate, count) * bet)
    if (amount <= 0) continue
    if (!best || amount > best.amount) best = { lineIndex, symbol: candidate, count, amount }
  }

  return best
}

/**
 * За какой символ линия может заплатить.
 *
 * Обычно это символ на первом барабане. Но если там Wild, линия способна
 * заплатить и как линия Wild, и как линия первого обычного символа —
 * тогда проверяем оба варианта и берём выгодный игроку.
 */
function collectCandidates(symbols: readonly NeonSymbolId[]): NeonSymbolId[] {
  const first = symbols[0]
  if (first === undefined || first === SCATTER) return []
  if (first !== WILD) return [first]

  const firstRegular = symbols.find((symbol) => symbol !== WILD && symbol !== SCATTER)
  return firstRegular ? [WILD, firstRegular] : [WILD]
}

/** Сколько символов подряд с первого барабана совпадает с candidate (с учётом Wild). */
function countFromLeft(symbols: readonly NeonSymbolId[], candidate: NeonSymbolId): number {
  let count = 0

  for (const symbol of symbols) {
    const matches = symbol === candidate || symbol === WILD
    if (!matches) break
    count += 1
  }

  return count
}

function payoutMultiplier(symbol: NeonSymbolId, count: number): number {
  return PAYTABLE[symbol][count - MIN_MATCH] ?? 0
}

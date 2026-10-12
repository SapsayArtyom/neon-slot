import type { GridCell } from '@sdk'
import { evaluateLines, type LineWin } from './evaluateLines'
import { applyStickyWilds, findWilds, freeSpinsFor } from './freeSpins'
import type { NeonGrid } from './grid'
import { roundMoney } from './money'
import { spinGrid } from './spin'

/** Результат одного спина — то, что «сервер» отдаёт клиенту. */
export type NeonSpinOutcome = {
  grid: NeonGrid
  totalWin: number
  lineWins: LineWin[]
  /** Сколько фриспинов начислил этот спин. */
  freeSpinsAwarded: number
  /** Сколько фриспинов осталось после него. Больше нуля — раунд продолжается. */
  freeSpinsLeft: number
  /** Спин был бесплатным. */
  isFreeSpin: boolean
  /** Клетки с залипшими Wild после этого спина. */
  stickyWilds: GridCell[]
}

/** Состояние раунда фриспинов. Живёт между спинами. */
export type FreeSpinsRound = {
  /** Ставка, на которой раунд выигран: внутри раунда она не меняется. */
  bet: number
  spinsLeft: number
  stickyWilds: GridCell[]
}

/** Спин вместе с новым состоянием раунда. */
export type SpinStep = {
  outcome: NeonSpinOutcome
  /** Раунд после спина. null — фриспинов больше нет. */
  round: FreeSpinsRound | null
}

/**
 * Один спин целиком: поле, выигрыши и новое состояние раунда фриспинов.
 *
 * Чистая функция: состояние раунда приходит аргументом и возвращается наружу,
 * внутри ничего не хранится. Благодаря этому тесты и расчёт отдачи прогоняют
 * ровно ту логику, что работает в игре, а не её копию.
 */
export function playSpin(
  random: () => number,
  bet: number,
  round: FreeSpinsRound | null,
): SpinStep {
  return round ? playFreeSpin(random, round) : playPaidSpin(random, bet)
}

function playPaidSpin(random: () => number, bet: number): SpinStep {
  const grid = spinGrid(random)
  const lineWins = evaluateLines(grid, bet)
  const freeSpinsAwarded = freeSpinsFor(grid)

  return {
    outcome: {
      grid,
      totalWin: sumWins(lineWins),
      lineWins,
      freeSpinsAwarded,
      freeSpinsLeft: freeSpinsAwarded,
      isFreeSpin: false,
      stickyWilds: [],
    },
    // Раунд начинается с чистого поля: Wild оплаченного спина не залипают.
    round: freeSpinsAwarded > 0 ? { bet, spinsLeft: freeSpinsAwarded, stickyWilds: [] } : null,
  }
}

function playFreeSpin(random: () => number, round: FreeSpinsRound): SpinStep {
  const grid = spinGrid(random)
  applyStickyWilds(grid, round.stickyWilds)

  // Все Wild на поле, включая только что выпавшие, остаются до конца раунда.
  const stickyWilds = findWilds(grid)
  const lineWins = evaluateLines(grid, round.bet)
  const spinsLeft = round.spinsLeft - 1

  return {
    outcome: {
      grid,
      totalWin: sumWins(lineWins),
      lineWins,
      // Скаттеры во фриспинах новых спинов не добавляют: раунд не продлевается.
      freeSpinsAwarded: 0,
      freeSpinsLeft: spinsLeft,
      isFreeSpin: true,
      stickyWilds,
    },
    round: spinsLeft > 0 ? { ...round, spinsLeft, stickyWilds } : null,
  }
}

function sumWins(wins: readonly LineWin[]): number {
  return roundMoney(wins.reduce((sum, win) => sum + win.amount, 0))
}

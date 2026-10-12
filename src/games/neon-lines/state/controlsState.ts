import type { SpinState } from '@sdk'
import type { Wallet } from './Wallet'

/** Что игрок может нажать прямо сейчас. Обе панели управления читают это. */
export type ControlsState = {
  canSpin: boolean
  canStop: boolean
  canLowerBet: boolean
  canRaiseBet: boolean
  /** Денег не хватает даже на минимальную ставку. */
  outOfFunds: boolean
  /** Можно ли переключить автоигру. */
  canToggleAutoplay: boolean
  /** Автоигра включена: кнопка подсвечена. */
  autoplayActive: boolean
}

/** Всё, от чего зависит доступность кнопок. */
export type GameStatus = {
  spin: SpinState
  wallet: Wallet
  /** Сколько фриспинов осталось. Больше нуля — раунд крутится сам. */
  freeSpinsLeft: number
  autoplay: boolean
}

/**
 * Вычисляет доступность кнопок.
 *
 * Вынесено из сцены отдельной функцией, потому что условий здесь несколько и
 * они легко расходятся. Так уже было: кнопки ставки проверяли только фазу
 * спина и поэтому разблокировались в паузах между фриспинами.
 */
export function controlsStateFor(status: GameStatus): ControlsState {
  const { spin, wallet, freeSpinsLeft, autoplay } = status

  // Между фриспинами контроллер успевает вернуться в покой, но раунд
  // продолжает крутиться сам — как и автоигра.
  const betweenSpins = spin.canSpin && freeSpinsLeft === 0
  const playerInControl = betweenSpins && !autoplay

  return {
    canSpin: playerInControl && wallet.canSpin,
    canStop: spin.canStop,
    // Ставку можно понижать и при нехватке денег — иначе из этого
    // состояния нельзя было бы выйти.
    canLowerBet: playerInControl && wallet.canLowerBet,
    canRaiseBet: playerInControl && wallet.canRaiseBet,
    outOfFunds: !wallet.canSpin,
    // Выключить автоигру можно в любой момент, включить — только между
    // спинами и когда есть на что играть.
    canToggleAutoplay: autoplay || (betweenSpins && wallet.canSpin),
    autoplayActive: autoplay,
  }
}

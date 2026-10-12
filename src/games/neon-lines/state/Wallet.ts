import { BET_STEPS, DEFAULT_BET, STARTING_BALANCE } from '../config/bets'
import { roundMoney } from '../math/money'

/**
 * Деньги игрока: баланс и выбранная ставка.
 *
 * Вынесено из сцены, чтобы все правила про деньги читались в одном месте,
 * а сцена занималась только отображением.
 */
export class Wallet {
  private currentBalance = STARTING_BALANCE
  private betIndex = Math.max(BET_STEPS.indexOf(DEFAULT_BET), 0)

  get balance(): number {
    return this.currentBalance
  }

  get bet(): number {
    return BET_STEPS[this.betIndex]!
  }

  /** Хватает ли денег на текущую ставку. */
  get canSpin(): boolean {
    return this.currentBalance >= this.bet
  }

  get canRaiseBet(): boolean {
    return this.betIndex < BET_STEPS.length - 1
  }

  get canLowerBet(): boolean {
    return this.betIndex > 0
  }

  raiseBet(): void {
    if (this.canRaiseBet) this.betIndex += 1
  }

  lowerBet(): void {
    if (this.canLowerBet) this.betIndex -= 1
  }

  /** Списывает ставку перед спином. */
  placeBet(): void {
    this.currentBalance = roundMoney(this.currentBalance - this.bet)
  }

  addWin(amount: number): void {
    this.currentBalance = roundMoney(this.currentBalance + amount)
  }
}

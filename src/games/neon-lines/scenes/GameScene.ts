import {
  applyLayout,
  delay,
  Scene,
  SpinController,
  type SpinService,
  type SymbolView,
  type Viewport,
  type WinHighlight,
} from '@sdk'
import { GAME_LAYOUT } from '../config/layout'
import { PAYLINES } from '../config/paylines'
import { SYMBOLS } from '../config/symbols'
import type { LineWin } from '../math/evaluateLines'
import type { NeonSpinOutcome } from '../math/round'
import { spinGrid } from '../math/spin'
import { controlsStateFor, type ControlsState } from '../state/controlsState'
import { Wallet } from '../state/Wallet'
import { ActionPanel } from '../ui/ActionPanel'
import { Background } from '../ui/Background'
import { BetPanel } from '../ui/BetPanel'
import { FreeSpinsBanner } from '../ui/FreeSpinsBanner'
import { ReelBoard } from '../ui/ReelBoard'
import { Readouts } from '../ui/Readouts'

export type GameSceneOptions = {
  /** Как выглядит символ. Приходит извне, потому что текстуры требуют рендерера. */
  createSymbolView: () => SymbolView
  /** Откуда берутся результаты спинов. */
  service: SpinService<NeonSpinOutcome>
}

/** Сколько держать подсветку выигрыша, прежде чем погасить её. */
const WIN_HOLD_MS = 700

/** Пауза между фриспинами: без неё раунд сливается в одну непрерывную прокрутку. */
const BETWEEN_FREE_SPINS_MS = 400

/** Пауза между спинами автоигры: игрок должен успеть разглядеть результат. */
const BETWEEN_AUTO_SPINS_MS = 300

/**
 * Основной экран игры.
 *
 * Сцена только связывает готовые части: блоки интерфейса, кошелёк и контроллер
 * спина из SDK. Правила игры живут в math/, настройки — в config/,
 * деньги — в Wallet. Здесь остаётся вёрстка и порядок действий.
 */
export class GameScene extends Scene {
  private readonly background = new Background()
  private readonly wallet = new Wallet()
  private readonly controller: SpinController<NeonSpinOutcome>

  /** Сколько фриспинов осталось. Больше нуля — раунд идёт, игрок не управляет. */
  private freeSpinsLeft = 0
  /** Выигрыш за раунд целиком: во фриспинах счётчик WIN не сбрасывается. */
  private roundWin = 0
  /** Автоигра включена: спины идут один за другим без участия игрока. */
  private autoplay = false

  /** Блоки, которые расставляет раскладка. Ключи совпадают с ключами GAME_LAYOUT. */
  readonly blocks: {
    banner: FreeSpinsBanner
    reels: ReelBoard
    readouts: Readouts
    bet: BetPanel
    actions: ActionPanel
  }

  constructor(options: GameSceneOptions) {
    super()

    this.blocks = {
      banner: new FreeSpinsBanner(),
      reels: new ReelBoard({ createSymbolView: options.createSymbolView }),
      readouts: new Readouts(),
      bet: new BetPanel({
        onLower: () => this.changeBet('lower'),
        onRaise: () => this.changeBet('raise'),
      }),
      actions: new ActionPanel({
        onSpinOrStop: () => this.spinOrStop(),
        onToggleTurbo: (active) => this.controller.setTurbo(active),
        onToggleAutoplay: (active) => this.toggleAutoplay(active),
      }),
    }

    this.controller = new SpinController({
      service: options.service,
      reels: this.blocks.reels.reels,
      present: (outcome) => this.presentWin(outcome),
      onStateChange: () => this.refreshControls(),
    })
  }

  override onEnter(): void {
    this.view.addChild(
      this.background,
      this.blocks.banner,
      this.blocks.reels,
      this.blocks.readouts,
      this.blocks.bet,
      this.blocks.actions,
    )

    this.blocks.reels.reels.showGrid(spinGrid(Math.random))
    this.blocks.readouts.setBalance(this.wallet.balance)
    this.blocks.readouts.setWin(0)
    this.blocks.bet.setBet(this.wallet.bet)
    this.refreshControls()
  }

  override resize(viewport: Viewport): void {
    this.background.resize(viewport)
    applyLayout(GAME_LAYOUT, viewport, this.blocks)
  }

  /**
   * Крутит спин или останавливает текущий. Публичный метод, потому что это же
   * действие вызывает горячая клавиша — её привязывает main.ts.
   */
  spinOrStop(): void {
    const state = this.controller.state

    if (state.canStop) {
      this.controller.stop()
      return
    }

    if (!this.controlsState().canSpin) return

    void this.playRound()
  }

  /**
   * Один оплаченный спин и, если он выиграл фриспины, весь их раунд.
   *
   * Фриспины крутятся сами: ставка за них не списывается, а источник
   * результатов сам помнит, сколько их осталось.
   */
  private async playRound(): Promise<void> {
    this.wallet.placeBet()
    this.roundWin = 0
    this.blocks.readouts.setWin(0)
    this.blocks.reels.overlay.hide()
    void this.blocks.readouts.animateBalance(this.wallet.balance)

    const bet = this.wallet.bet
    let outcome = await this.controller.spin(bet)

    while (outcome && outcome.freeSpinsLeft > 0) {
      await delay(BETWEEN_FREE_SPINS_MS)
      outcome = await this.controller.spin(bet)
    }
  }

  private toggleAutoplay(active: boolean): void {
    this.autoplay = active
    this.refreshControls()

    if (active) void this.runAutoplay()
  }

  /**
   * Автоигра: раунды идут один за другим, пока игрок её не выключит или пока
   * не кончатся деньги. Ограничения по числу спинов нет — это демо-режим.
   */
  private async runAutoplay(): Promise<void> {
    while (this.autoplay && this.wallet.canSpin) {
      await this.playRound()
      if (!this.autoplay) break

      await delay(BETWEEN_AUTO_SPINS_MS)
    }

    // Автоигра могла закончиться сама: кнопку нужно вернуть в исходное состояние.
    this.autoplay = false
    this.refreshControls()
  }

  private changeBet(direction: 'lower' | 'raise'): void {
    const state = this.controlsState()
    const allowed = direction === 'lower' ? state.canLowerBet : state.canRaiseBet
    if (!allowed) return

    if (direction === 'lower') this.wallet.lowerBet()
    else this.wallet.raiseBet()

    this.blocks.bet.setBet(this.wallet.bet)
    this.refreshControls()
  }

  /** Показ результата: фриспины, затем сумма и подсветка линий. */
  private async presentWin(outcome: NeonSpinOutcome): Promise<void> {
    this.freeSpinsLeft = outcome.freeSpinsLeft
    this.blocks.reels.showStickyWilds(outcome.stickyWilds)
    this.refreshControls()

    if (outcome.freeSpinsAwarded > 0) {
      // Раунд только что выигран: баннер и бонусный фон появляются
      // до первого фриспина.
      this.blocks.banner.setSpinsLeft(outcome.freeSpinsLeft)
      await Promise.all([this.blocks.banner.show(), this.background.setBonus(true)])
    } else if (outcome.isFreeSpin) {
      this.blocks.banner.setSpinsLeft(outcome.freeSpinsLeft)
    }

    await this.showLineWins(outcome)

    if (outcome.isFreeSpin && outcome.freeSpinsLeft === 0) {
      await Promise.all([this.blocks.banner.hide(), this.background.setBonus(false)])
      this.blocks.reels.hideStickyWilds()
    }
  }

  private async showLineWins(outcome: NeonSpinOutcome): Promise<void> {
    if (outcome.lineWins.length === 0) return

    this.wallet.addWin(outcome.totalWin)
    this.roundWin += outcome.totalWin
    this.blocks.reels.overlay.draw(toHighlights(outcome.lineWins))

    await Promise.all([
      this.blocks.reels.overlay.showAnimated(),
      this.blocks.readouts.animateWin(this.roundWin),
      this.blocks.readouts.animateBalance(this.wallet.balance),
    ])

    await delay(WIN_HOLD_MS)
    await this.blocks.reels.overlay.hideAnimated()
  }

  private refreshControls(): void {
    const state = this.controlsState()

    this.blocks.bet.setState(state)
    this.blocks.actions.setState(state)
  }

  /** Единственное место, где решается, что сейчас доступно игроку. */
  private controlsState(): ControlsState {
    return controlsStateFor({
      spin: this.controller.state,
      wallet: this.wallet,
      freeSpinsLeft: this.freeSpinsLeft,
      autoplay: this.autoplay,
    })
  }
}

/**
 * Переводит выигрыши игры в подсветку для SDK.
 *
 * Линия рисуется только по выигравшему отрезку, а не по всем пяти барабанам:
 * иначе за три символа подсвечивалась бы линия целиком, и это вводило бы в
 * заблуждение. Цвет берётся от самого символа, поэтому разные выигрыши
 * на поле различимы.
 */
function toHighlights(wins: readonly LineWin[]): WinHighlight[] {
  return wins.map((win) => {
    const path = (PAYLINES[win.lineIndex] ?? []).slice(0, win.count)

    return {
      path,
      cells: path.map((row, column) => ({ column, row })),
      color: SYMBOLS[win.symbol].color,
    }
  })
}

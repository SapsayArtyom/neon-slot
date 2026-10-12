import gsap from 'gsap'
import type { SpinOutcome, SpinService } from '../api/types'
import type { ReelSet } from '../reels/ReelSet'

/**
 * Фазы спина.
 *
 * 'spinning'   — барабаны крутятся, ждём ответ источника результатов;
 * 'stopping'   — барабаны встают на присланное поле;
 * 'presenting' — показываем выигрыш;
 * 'idle'       — можно крутить снова.
 */
export type SpinPhase = 'idle' | 'spinning' | 'stopping' | 'presenting'

/**
 * Что игрок может сделать прямо сейчас.
 *
 * Игра рисует кнопки по этому состоянию и не повторяет его логику у себя.
 * Отдельного флага «Stop уже нажат» наружу нет: он уже учтён в canStop,
 * поэтому повторное нажатие невозможно по построению.
 */
export type SpinState = {
  phase: SpinPhase
  canSpin: boolean
  canStop: boolean
}

export type SpinControllerOptions<TOutcome extends SpinOutcome> = {
  service: SpinService<TOutcome>
  reels: ReelSet
  /** Минимальное время прокрутки, сек: спин не «моргнёт» при быстром ответе. */
  minSpinSeconds?: number
  /** То же в турбо: там прокрутка почти не задерживается. */
  turboMinSpinSeconds?: number
  /** Показ результата: подсветка линий, счёт выигрыша. */
  present: (outcome: TOutcome) => Promise<void> | void
  /** Состояние изменилось. По нему игра включает и гасит кнопки. */
  onStateChange?: (state: SpinState) => void
}

const DEFAULT_MIN_SPIN_SECONDS = 0.7
const DEFAULT_TURBO_MIN_SPIN_SECONDS = 0.1

/**
 * Ведёт один спин от нажатия кнопки до возврата в состояние покоя.
 *
 * Фазы сменяются строго по порядку, поэтому весь цикл записан как обычная
 * последовательность шагов в `spin()` — её можно прочитать сверху вниз.
 */
export class SpinController<TOutcome extends SpinOutcome> {
  private readonly options: SpinControllerOptions<TOutcome>
  private readonly minSpinSeconds: number
  private readonly turboMinSpinSeconds: number

  private currentPhase: SpinPhase = 'idle'
  /** Stop уже нажат: кнопка гаснет, повторное нажатие игнорируется. */
  private stopRequested = false
  private turbo = false
  private minimumSpinWait: gsap.core.Tween | null = null

  constructor(options: SpinControllerOptions<TOutcome>) {
    this.options = options
    this.minSpinSeconds = options.minSpinSeconds ?? DEFAULT_MIN_SPIN_SECONDS
    this.turboMinSpinSeconds = options.turboMinSpinSeconds ?? DEFAULT_TURBO_MIN_SPIN_SECONDS
  }

  get state(): SpinState {
    const phase = this.currentPhase
    const stopping = phase === 'spinning' || phase === 'stopping'

    return {
      phase,
      canSpin: phase === 'idle',
      canStop: stopping && !this.stopRequested,
    }
  }

  setTurbo(enabled: boolean): void {
    this.turbo = enabled
  }

  /** Крутит один спин. Возвращает null, если спин уже идёт. */
  async spin(bet: number): Promise<TOutcome | null> {
    if (!this.state.canSpin) return null

    const { service, reels, present } = this.options

    this.setPhase('spinning')
    reels.setTurbo(this.turbo)
    reels.startSpin()

    // Запрос уходит сразу, а ждём мы минимальное время прокрутки: даже при
    // мгновенном ответе барабаны успеют раскрутиться. Это ожидание прерывает
    // кнопка Stop, поэтому оно вынесено в отдельный шаг, а не в Promise.all.
    const response = service.spin({ bet })
    await this.waitMinimumSpin()
    const outcome = await response

    this.setPhase('stopping')
    const stopping = reels.stopAt(outcome.grid)

    // Stop могли нажать, пока ждали ответ источника. Остановку нельзя было
    // ускорить тогда — её ещё не существовало, — поэтому ускоряем сразу,
    // как только она началась.
    if (this.stopRequested) reels.hurryStop()
    await stopping

    this.setPhase('presenting')
    await present(outcome)

    this.setPhase('idle')
    return outcome
  }

  /**
   * Кнопка Stop. Срабатывает один раз за спин: сразу после нажатия canStop
   * становится false, и игра гасит кнопку.
   */
  stop(): void {
    if (!this.state.canStop) return

    this.stopRequested = true
    this.notify()

    if (this.currentPhase === 'spinning') {
      // Поле ещё не пришло: перестаём ждать минимальную прокрутку.
      // Саму остановку ускорит spin(), как только результат придёт.
      this.minimumSpinWait?.totalProgress(1)
      return
    }

    // Барабаны уже встают: остановку не обрываем, а доигрываем быстрее.
    this.options.reels.hurryStop()
  }

  /** Пауза на game-тикере, которую можно прервать досрочно. */
  private waitMinimumSpin(): Promise<void> {
    const seconds = this.turbo ? this.turboMinSpinSeconds : this.minSpinSeconds

    return new Promise((resolve) => {
      this.minimumSpinWait = gsap.delayedCall(seconds, () => {
        this.minimumSpinWait = null
        resolve()
      })
    })
  }

  private setPhase(phase: SpinPhase): void {
    this.currentPhase = phase
    if (phase === 'idle') this.stopRequested = false
    this.notify()
  }

  private notify(): void {
    this.options.onStateChange?.(this.state)
  }
}

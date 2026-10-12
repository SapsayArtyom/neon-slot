import { createRandom, delay, type SpinRequest, type SpinService } from '@sdk'
import { playSpin, type FreeSpinsRound, type NeonSpinOutcome } from '../math/round'

export type MockSpinServiceOptions = {
  /** Seed генератора. Один и тот же seed даёт одну и ту же серию спинов. */
  seed?: number
  /** Имитация задержки сервера в миллисекундах. */
  latencyMs?: number
}

const DEFAULT_LATENCY_MS = 250

/**
 * Мок игрового сервера.
 *
 * Весь результат спина считается здесь и отдаётся готовым — клиент только
 * проигрывает его на экране. Незавершённый раунд фриспинов тоже хранится
 * здесь, как в настоящей игровой сессии: клиент не может его подделать и
 * просто продолжает запрашивать спины, пока сервер сообщает, что они остались.
 *
 * Заменить мок на HTTP-клиент можно, не меняя игру: контракт SpinService тот же.
 */
export class MockSpinService implements SpinService<NeonSpinOutcome> {
  private readonly random: () => number
  private readonly latencyMs: number
  private round: FreeSpinsRound | null = null

  constructor(options: MockSpinServiceOptions = {}) {
    this.random = createRandom(options.seed ?? Date.now())
    this.latencyMs = options.latencyMs ?? DEFAULT_LATENCY_MS
  }

  /** Во время раунда фриспинов присланная ставка игнорируется: раунд держит свою. */
  async spin(request: SpinRequest): Promise<NeonSpinOutcome> {
    await delay(this.latencyMs)

    const step = playSpin(this.random, request.bet, this.round)
    this.round = step.round
    return step.outcome
  }
}

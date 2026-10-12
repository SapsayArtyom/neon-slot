/**
 * Контракт источника результатов спина.
 *
 * SDK намеренно знает о результате лишь минимум: какие символы встали на поле
 * и сколько всего выиграно. Что считается выигрышем — линии, кластеры, ways —
 * решает игра, расширяя SpinOutcome своими полями.
 */

/** Идентификатор символа. Для SDK это просто строка. */
export type SymbolId = string

/** Поле символов. Первый индекс — барабан (слева направо), второй — ряд (сверху вниз). */
export type Grid = SymbolId[][]

export type SpinRequest = {
  /** Полная ставка за спин. */
  bet: number
}

/** Минимум, который нужен SDK, чтобы проиграть результат на экране. */
export type SpinOutcome = {
  grid: Grid
  totalWin: number
}

/**
 * Откуда игра берёт результаты. В тестовом задании это мок,
 * в реальном проекте — HTTP-клиент к игровому серверу. Для SDK разницы нет.
 */
export type SpinService<TOutcome extends SpinOutcome = SpinOutcome> = {
  spin(request: SpinRequest): Promise<TOutcome>
}

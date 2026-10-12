/**
 * Детерминированный генератор случайных чисел.
 *
 * Один и тот же seed всегда даёт одну и ту же последовательность —
 * благодаря этому результаты спинов воспроизводимы и покрываются тестами.
 * Алгоритм mulberry32: короткий, быстрый, достаточного качества для мока.
 */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

/** Целое число от 0 до maxExclusive - 1. */
export function randomInt(random: () => number, maxExclusive: number): number {
  return Math.floor(random() * maxExclusive)
}

/** Перемешивание Фишера–Йетса. Исходный массив не меняется. */
export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items]

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomInt(random, i + 1)
    const temp = result[i]!
    result[i] = result[j]!
    result[j] = temp
  }

  return result
}

/** Пауза в миллисекундах. Нужна моку, чтобы имитировать задержку сервера. */
export function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

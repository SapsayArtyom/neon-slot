import type { Container } from 'pixi.js'
import type { SymbolId } from '../api/types'

/**
 * Объект, который умеет показать любой символ.
 *
 * Как выглядит символ, решает игра — SDK только двигает эти объекты и просит
 * сменить символ. Важно, что `setSymbol` переиспользует один и тот же объект:
 * во время прокрутки символы меняются десятки раз в секунду, и создавать
 * новые объекты на каждую смену было бы расточительно.
 */
export type SymbolView = Container & {
  setSymbol(symbol: SymbolId): void
}

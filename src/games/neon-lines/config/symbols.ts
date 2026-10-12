import { THEME } from './theme'

/** Все символы игры. Карточные младшие, три старших, Wild и Scatter. */
export type NeonSymbolId =
  'ten' | 'jack' | 'queen' | 'king' | 'ace' | 'orb' | 'prism' | 'core' | 'wild' | 'scatter'

export type SymbolInfo = {
  /** Подпись на символе. Используется, когда emblem = 'text'. */
  label: string
  color: number
  /**
   * Чем рисуется символ: подписью или геометрической фигурой.
   * Фигуры выбраны вместо символов юникода, потому что их наличие
   * в системном шрифте не гарантировано.
   */
  emblem: 'text' | 'circle' | 'triangle' | 'star'
  /**
   * 'wild'    — подставляется вместо любого символа, кроме Scatter;
   * 'scatter' — не участвует в линиях, но запускает фриспины;
   * остальные — обычные оплачиваемые символы.
   */
  kind: 'royal' | 'high' | 'wild' | 'scatter'
}

export const SYMBOLS: Record<NeonSymbolId, SymbolInfo> = {
  ten: { label: '10', color: 0x6c7ac9, kind: 'royal', emblem: 'text' },
  jack: { label: 'J', color: 0x7f6cc9, kind: 'royal', emblem: 'text' },
  queen: { label: 'Q', color: 0x4f8fd0, kind: 'royal', emblem: 'text' },
  king: { label: 'K', color: 0x4fc0b0, kind: 'royal', emblem: 'text' },
  ace: { label: 'A', color: 0x8ad04f, kind: 'royal', emblem: 'text' },
  orb: { label: 'ORB', color: THEME.accent, kind: 'high', emblem: 'circle' },
  prism: { label: 'PRISM', color: THEME.highlight, kind: 'high', emblem: 'triangle' },
  core: { label: 'CORE', color: THEME.gold, kind: 'high', emblem: 'star' },
  wild: { label: 'WILD', color: 0xffffff, kind: 'wild', emblem: 'text' },
  scatter: { label: 'FREE', color: 0xff6b35, kind: 'scatter', emblem: 'text' },
}

export const WILD: NeonSymbolId = 'wild'
export const SCATTER: NeonSymbolId = 'scatter'

/** Список всех идентификаторов — удобно для загрузки ресурсов и тестов. */
export const SYMBOL_IDS = Object.keys(SYMBOLS) as NeonSymbolId[]

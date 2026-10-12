import { GRID, gridHeight, gridWidth } from './grid'

/**
 * Высота всех блоков интерфейса. Одна на всех, чтобы нижний ряд читался
 * как одна полоса, а не как три разных плашки.
 */
export const BLOCK_HEIGHT = 130

/** Отступ от края блока до его содержимого. */
export const BLOCK_PADDING = 20

/**
 * Высота содержимого внутри блока.
 *
 * От неё ValueCounter берёт размеры шрифта, поэтому у BALANCE, WIN, BET и
 * счётчика фриспинов подписи и числа одинакового размера — это не совпадение,
 * а следствие одной константы.
 */
export const CONTENT_HEIGHT = BLOCK_HEIGHT - BLOCK_PADDING * 2

const RADIUS = 24

/** Рамка вокруг окна барабанов. */
export const BOARD = {
  width: gridWidth() + GRID.padding * 2,
  height: gridHeight() + GRID.padding * 2,
  radius: RADIUS,
} as const

/** Блок счётчиков: баланс и выигрыш. */
export const READOUTS = {
  width: 460,
  height: BLOCK_HEIGHT,
  radius: RADIUS,
  padding: BLOCK_PADDING,
  counterWidth: 200,
} as const

/**
 * Блок ставки: кнопки «минус» и «плюс» вокруг значения.
 *
 * Управление разделено на два блока, а не собрано в одну полосу: иначе на
 * узком телефоне все шесть элементов масштабируются вместе и кнопки ставки
 * падают ниже удобного для пальца размера.
 */
export const BET_PANEL = {
  width: 380,
  height: BLOCK_HEIGHT,
  radius: RADIUS,
  padding: BLOCK_PADDING,
  gap: 14,
  /** Квадратная кнопка во всю высоту содержимого. */
  stepButton: CONTENT_HEIGHT,
} as const

/** Блок действий: Spin, турбо и автоигра. */
export const ACTIONS = {
  width: 516,
  height: BLOCK_HEIGHT,
  radius: RADIUS,
  padding: BLOCK_PADDING,
  gap: 18,
  spinWidth: 240,
  toggleWidth: 100,
  rowHeight: CONTENT_HEIGHT,
  /** Подписи на переключателях длиннее, чем на Spin, поэтому шрифт мельче. */
  toggleFontSize: 20,
} as const

/** Баннер фриспинов над полем. Видим только во время раунда. */
export const BANNER = {
  width: 420,
  height: BLOCK_HEIGHT,
  radius: RADIUS,
  padding: BLOCK_PADDING,
} as const

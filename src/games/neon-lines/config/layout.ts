import type { LayoutScheme } from '@sdk'
import { ACTIONS, BET_PANEL, READOUTS } from './panel'

/**
 * Вся вёрстка экрана в одном месте: для каждого блока — место в альбоме и в
 * портрете. Числа — доли экрана, поэтому раскладка одинаково работает на
 * телефоне и на мониторе.
 *
 * Правило: у каждого блока задаются ОБЕ границы, fitWidth и fitHeight.
 * Если оставить одну, на непривычных пропорциях блок вырастет по второй оси
 * и наедет на соседей.
 *
 * Что блоки не пересекаются и остаются одной высоты ни при каких пропорциях
 * экрана, проверяет GameScene.test.ts.
 *
 * Фона здесь нет: он не масштабируется, а перерисовывается под размер экрана.
 */

/** Какую долю ширины экрана занимает нижний ряд целиком, вместе с зазорами. */
const ROW_WIDTH_SHARE = 0.88

/** В портрете блоки стоят друг под другом, поэтому ряд — самый широкий из них. */
const COLUMN_WIDTH_SHARE = 0.96

const ROW_WIDTH = READOUTS.width + BET_PANEL.width + ACTIONS.width
const WIDEST_BLOCK = Math.max(READOUTS.width, BET_PANEL.width, ACTIONS.width)

/**
 * Доли ширины для блоков интерфейса считаются, а не вписываются руками.
 *
 * Раскладка масштабирует каждый блок независимо, поэтому одинаковая проектная
 * высота сама по себе ничего не гарантирует. Масштаб совпадает только если
 * доля ширины пропорциональна проектной ширине блока: тогда и ограничение по
 * ширине, и ограничение по высоте дают всем блокам ряда одно и то же число.
 *
 * Вписанные вручную доли эту пропорцию ломают при первой же правке ширины
 * блока, и ряд незаметно становится ступенчатым.
 */
function rowShare(blockWidth: number): number {
  return (blockWidth / ROW_WIDTH) * ROW_WIDTH_SHARE
}

function columnShare(blockWidth: number): number {
  return (blockWidth / WIDEST_BLOCK) * COLUMN_WIDTH_SHARE
}

/** Одна доля высоты на все блоки ряда — вторая половина условия равной высоты. */
const ROW_HEIGHT_SHARE = 0.2
const COLUMN_HEIGHT_SHARE = 0.14

export const GAME_LAYOUT = {
  banner: {
    landscape: { x: 0.5, y: 0.03, anchorY: 0, fitWidth: 0.26, fitHeight: 0.09 },
    portrait: { x: 0.5, y: 0.03, anchorY: 0, fitWidth: 0.7, fitHeight: 0.06 },
  },
  reels: {
    landscape: { x: 0.5, y: 0.44, fitWidth: 0.56, fitHeight: 0.56 },
    portrait: { x: 0.5, y: 0.29, fitWidth: 0.96, fitHeight: 0.36 },
  },
  readouts: {
    landscape: {
      x: 0.02,
      y: 0.97,
      anchorX: 0,
      anchorY: 1,
      fitWidth: rowShare(READOUTS.width),
      fitHeight: ROW_HEIGHT_SHARE,
    },
    portrait: {
      x: 0.5,
      y: 0.627,
      anchorY: 1,
      fitWidth: columnShare(READOUTS.width),
      fitHeight: COLUMN_HEIGHT_SHARE,
    },
  },
  bet: {
    landscape: {
      x: 0.5,
      y: 0.97,
      anchorY: 1,
      fitWidth: rowShare(BET_PANEL.width),
      fitHeight: ROW_HEIGHT_SHARE,
    },
    portrait: {
      x: 0.5,
      y: 0.798,
      anchorY: 1,
      fitWidth: columnShare(BET_PANEL.width),
      fitHeight: COLUMN_HEIGHT_SHARE,
    },
  },
  actions: {
    landscape: {
      x: 0.98,
      y: 0.97,
      anchorX: 1,
      anchorY: 1,
      fitWidth: rowShare(ACTIONS.width),
      fitHeight: ROW_HEIGHT_SHARE,
    },
    portrait: {
      x: 0.5,
      y: 0.97,
      anchorY: 1,
      fitWidth: columnShare(ACTIONS.width),
      fitHeight: COLUMN_HEIGHT_SHARE,
    },
  },
} satisfies LayoutScheme<'banner' | 'reels' | 'readouts' | 'bet' | 'actions'>

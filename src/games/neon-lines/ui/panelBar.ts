import { Graphics } from 'pixi.js'
import { THEME } from '../config/theme'

/**
 * Подложка любого блока интерфейса. Одна функция на все блоки —
 * так рамка поля, счётчики и управление выглядят одной системой.
 */
export function drawPanelBar(width: number, height: number, radius: number): Graphics {
  return new Graphics()
    .roundRect(0, 0, width, height, radius)
    .fill({ color: THEME.surface, alpha: 0.92 })
    .stroke({ width: 2, color: THEME.accent, alpha: 0.35 })
}

import { Container, Graphics } from 'pixi.js'
import { tweenTo, type Viewport } from '@sdk'
import { THEME } from '../config/theme'

const TRANSITION_SECONDS = 0.6

/**
 * Фон игры: обычный и бонусный.
 *
 * Два слоя вместо перекраски одного. Плавный переход тогда сводится к
 * изменению прозрачности верхнего слоя, и не нужно интерполировать цвета
 * и перерисовывать геометрию на каждом кадре.
 *
 * Фон не масштабируется, а перерисовывается под размер экрана: иначе
 * световые пятна растягивались бы вместе с ним и «плыли».
 */
export class Background extends Container {
  private readonly base = new Graphics()
  private readonly bonus = new Graphics()

  constructor() {
    super()

    this.bonus.alpha = 0
    this.addChild(this.base, this.bonus)
  }

  /** Переключает фон между обычным и бонусным. Переход плавный. */
  setBonus(active: boolean): Promise<void> {
    return tweenTo(this.bonus, {
      alpha: active ? 1 : 0,
      duration: TRANSITION_SECONDS,
      ease: 'power2.inOut',
      overwrite: true,
    })
  }

  resize(viewport: Viewport): void {
    drawBase(this.base, viewport)
    drawBonus(this.bonus, viewport)
  }
}

/** Обычный фон: два мягких пятна света по углам. */
function drawBase(layer: Graphics, viewport: Viewport): void {
  const { width, height } = viewport
  const radius = Math.max(width, height) * 0.45

  layer.clear()
  layer.rect(0, 0, width, height).fill(THEME.backdrop)
  layer.ellipse(width * 0.25, height * 0.2, radius, radius).fill({
    color: THEME.accent,
    alpha: 0.06,
  })
  layer.ellipse(width * 0.8, height * 0.85, radius, radius).fill({
    color: THEME.highlight,
    alpha: 0.05,
  })
}

/**
 * Бонусный фон: тёплая золотая пелена и симметричные пятна по центру.
 *
 * Новых цветов не добавляется — только золото и второй акцент из палитры.
 * Отличается не просто оттенком, а композицией: по центру вместо углов,
 * поэтому переход в бонус заметен сразу.
 */
function drawBonus(layer: Graphics, viewport: Viewport): void {
  const { width, height } = viewport
  const radius = Math.max(width, height) * 0.6

  layer.clear()
  layer.rect(0, 0, width, height).fill({ color: THEME.gold, alpha: 0.07 })
  layer.ellipse(width * 0.5, height * 0.15, radius, radius).fill({
    color: THEME.gold,
    alpha: 0.13,
  })
  layer.ellipse(width * 0.5, height, radius * 0.9, radius * 0.9).fill({
    color: THEME.highlight,
    alpha: 0.09,
  })
}

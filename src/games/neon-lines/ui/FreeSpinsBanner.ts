import gsap from 'gsap'
import { Container, Rectangle } from 'pixi.js'
import { tweenTo, ValueCounter } from '@sdk'
import { FONT_FAMILY } from '../config/fonts'
import { BANNER, CONTENT_HEIGHT } from '../config/panel'
import { THEME } from '../config/theme'
import { FREE_SPINS_AWARDED } from '../math/freeSpins'
import { drawPanelBar } from './panelBar'

/**
 * Счётчик фриспинов над полем. Появляется, когда раунд выигран, и исчезает,
 * когда он закончился.
 *
 * Содержимое вынесено во внутренний контейнер, потому что появление —
 * это анимация масштаба, а внешний масштаб блока принадлежит раскладке.
 * Если тронуть его здесь, раскладка и анимация начнут спорить.
 */
export class FreeSpinsBanner extends Container {
  private readonly content = new Container()
  private readonly counter: ValueCounter

  constructor() {
    super()

    this.counter = new ValueCounter({
      label: 'FREE SPINS',
      width: BANNER.width - BANNER.padding * 2,
      height: CONTENT_HEIGHT,
      format: (value) => `${Math.round(value)} / ${FREE_SPINS_AWARDED}`,
      labelColor: THEME.text,
      valueColor: THEME.gold,
      fontFamily: FONT_FAMILY,
    })
    this.counter.position.set(BANNER.padding, BANNER.padding)

    this.content.addChild(drawPanelBar(BANNER.width, BANNER.height, BANNER.radius), this.counter)
    this.content.pivot.set(BANNER.width / 2, BANNER.height / 2)
    this.content.position.set(BANNER.width / 2, BANNER.height / 2)

    this.addChild(this.content)
    this.boundsArea = new Rectangle(0, 0, BANNER.width, BANNER.height)

    this.visible = false
    this.alpha = 0
  }

  setSpinsLeft(left: number): void {
    this.counter.set(left)
  }

  async show(): Promise<void> {
    if (this.visible) return

    this.visible = true
    gsap.killTweensOf(this.content.scale)
    this.content.scale.set(0.75)

    await Promise.all([
      tweenTo(this, { alpha: 1, duration: 0.2, overwrite: true }),
      tweenTo(this.content.scale, {
        x: 1,
        y: 1,
        duration: 0.45,
        ease: 'back.out(2.2)',
        overwrite: true,
      }),
    ])
  }

  async hide(): Promise<void> {
    if (!this.visible) return

    await tweenTo(this, { alpha: 0, duration: 0.25, overwrite: true })
    this.visible = false
  }
}

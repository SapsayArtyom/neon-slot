import gsap from 'gsap'
import { Container, Graphics, Rectangle, Text } from 'pixi.js'

export type ButtonOptions = {
  width: number
  height: number
  label: string
  onPress: () => void
  /** Цвета передаёт игра: SDK не знает её палитру. */
  fill: number
  textColor: number
  radius?: number
  fontSize?: number
}

/** Насколько кнопка «вжимается» при нажатии. */
const PRESSED_SCALE = 0.96

const DISABLED_ALPHA = 0.4

/**
 * Кнопка на Pixi: одинаково работает с мышью и касаниями,
 * потому что Pixi сводит и то и другое к событиям pointer.
 */
export class Button extends Container {
  /** Вжатие масштабирует содержимое, а не саму кнопку: её положение задаёт игра. */
  private readonly content = new Container()
  private readonly background: Graphics
  private readonly caption: Text
  private isEnabled = true

  constructor(options: ButtonOptions) {
    super()

    const radius = options.radius ?? 16

    // Фон рисуется белым и раскрашивается через tint. Tint умеет только
    // затемнять, поэтому белая основа — единственный способ менять цвет
    // кнопки в обе стороны (см. setTint, им пользуется ToggleButton).
    this.background = new Graphics()
    this.background
      .roundRect(0, 0, options.width, options.height, radius)
      .fill(0xffffff)
      .stroke({ width: 2, color: options.textColor, alpha: 0.25 })
    this.background.tint = options.fill

    this.caption = new Text({
      text: options.label,
      style: {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: options.fontSize ?? Math.round(options.height * 0.34),
        fontWeight: '700',
        fill: options.textColor,
      },
    })
    this.caption.anchor.set(0.5)
    this.caption.position.set(options.width / 2, options.height / 2)

    this.content.addChild(this.background, this.caption)
    // Масштаб от центра, чтобы кнопка вжималась, а не уезжала в угол.
    this.content.pivot.set(options.width / 2, options.height / 2)
    this.content.position.set(options.width / 2, options.height / 2)
    this.addChild(this.content)

    // Область нажатия и размер объявлены явно: попадание считается без обхода
    // детей, палец попадает по всей площади, а раскладка не измеряет текст.
    this.hitArea = new Rectangle(0, 0, options.width, options.height)
    this.boundsArea = new Rectangle(0, 0, options.width, options.height)
    this.eventMode = 'static'
    this.cursor = 'pointer'

    this.on('pointerdown', () => this.setPressed(true))
    this.on('pointerup', () => this.setPressed(false))
    this.on('pointerupoutside', () => this.setPressed(false))
    this.on('pointertap', () => {
      if (this.isEnabled) options.onPress()
    })
  }

  setLabel(label: string): void {
    this.caption.text = label
  }

  /** Цвет кнопки. Меняется мгновенно: плавный переход между цветами здесь не нужен. */
  setTint(color: number): void {
    this.background.tint = color
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    this.cursor = enabled ? 'pointer' : 'default'

    gsap.to(this, { alpha: enabled ? 1 : DISABLED_ALPHA, duration: 0.15, overwrite: true })

    // Кнопку могли выключить, пока палец её держал: вжатие нужно отпустить.
    if (!enabled) this.releaseScale()
  }

  private setPressed(pressed: boolean): void {
    if (!this.isEnabled) return
    if (pressed) this.pressScale()
    else this.releaseScale()
  }

  private pressScale(): void {
    gsap.to(this.content.scale, {
      x: PRESSED_SCALE,
      y: PRESSED_SCALE,
      duration: 0.08,
      ease: 'power2.out',
      overwrite: true,
    })
  }

  private releaseScale(): void {
    gsap.to(this.content.scale, {
      x: 1,
      y: 1,
      duration: 0.18,
      ease: 'back.out(2.5)',
      overwrite: true,
    })
  }
}

import { Container, Graphics, Rectangle, Text } from 'pixi.js'
import { place, Scene, type Viewport } from '@sdk'
import { THEME } from '../config/theme'

const BAR = { width: 420, height: 10, radius: 5 }

/**
 * Экран загрузки ресурсов.
 *
 * Шрифт игры здесь ещё не загружен, поэтому подпись набрана системным —
 * это единственное место в игре, где так и должно быть.
 */
export class LoadingScene extends Scene {
  private readonly background = new Graphics()
  private readonly block = new Container()
  private readonly barFill = new Graphics()

  override onEnter(): void {
    const title = new Text({
      text: 'NEON LINES',
      style: {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: 48,
        fontWeight: '700',
        fill: THEME.text,
        letterSpacing: 8,
      },
    })
    title.anchor.set(0.5, 1)
    title.position.set(BAR.width / 2, -28)

    const barTrack = new Graphics()
      .roundRect(0, 0, BAR.width, BAR.height, BAR.radius)
      .fill({ color: THEME.surface })

    this.block.addChild(title, barTrack, this.barFill)
    this.block.boundsArea = new Rectangle(0, -100, BAR.width, 100 + BAR.height)

    this.view.addChild(this.background, this.block)
    this.setProgress(0)
  }

  setProgress(fraction: number): void {
    const width = Math.max(BAR.width * fraction, 1)

    this.barFill
      .clear()
      .roundRect(0, 0, width, BAR.height, BAR.radius)
      .fill({ color: THEME.accent })
  }

  override resize(viewport: Viewport): void {
    this.background.clear().rect(0, 0, viewport.width, viewport.height).fill(THEME.backdrop)

    place(this.block, { x: 0.5, y: 0.5, fitWidth: 0.7, fitHeight: 0.5 }, viewport)
  }
}

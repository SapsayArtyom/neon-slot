import { Container, Rectangle } from 'pixi.js'
import { ValueCounter } from '@sdk'
import { FONT_FAMILY } from '../config/fonts'
import { CONTENT_HEIGHT, READOUTS } from '../config/panel'
import { THEME } from '../config/theme'
import { formatMoney } from '../math/money'
import { drawPanelBar } from './panelBar'

/** Полоса со счётчиками баланса и выигрыша. */
export class Readouts extends Container {
  private readonly balance: ValueCounter
  private readonly win: ValueCounter

  constructor() {
    super()

    this.balance = this.createCounter('BALANCE', THEME.gold)
    this.win = this.createCounter('WIN', THEME.highlight)

    this.balance.position.set(READOUTS.padding, READOUTS.padding)
    this.win.position.set(
      READOUTS.width - READOUTS.padding - READOUTS.counterWidth,
      READOUTS.padding,
    )

    this.addChild(
      drawPanelBar(READOUTS.width, READOUTS.height, READOUTS.radius),
      this.balance,
      this.win,
    )

    this.boundsArea = new Rectangle(0, 0, READOUTS.width, READOUTS.height)
  }

  setBalance(value: number): void {
    this.balance.set(value)
  }

  animateBalance(value: number): Promise<void> {
    return this.balance.animateTo(value)
  }

  setWin(value: number): void {
    this.win.set(value)
  }

  animateWin(value: number): Promise<void> {
    return this.win.animateTo(value)
  }

  private createCounter(label: string, valueColor: number): ValueCounter {
    return new ValueCounter({
      label,
      width: READOUTS.counterWidth,
      height: CONTENT_HEIGHT,
      format: formatMoney,
      labelColor: THEME.text,
      valueColor,
      fontFamily: FONT_FAMILY,
    })
  }
}

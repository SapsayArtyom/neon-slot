import { Container, Rectangle } from 'pixi.js'
import { Button, ValueCounter } from '@sdk'
import { FONT_FAMILY } from '../config/fonts'
import { BET_PANEL, CONTENT_HEIGHT } from '../config/panel'
import { THEME } from '../config/theme'
import { formatMoney } from '../math/money'
import type { ControlsState } from '../state/controlsState'
import { drawPanelBar } from './panelBar'

export type BetPanelOptions = {
  onLower: () => void
  onRaise: () => void
}

/** Блок ставки: «минус», значение и «плюс». */
export class BetPanel extends Container {
  private readonly lower: Button
  private readonly raise: Button
  private readonly value: ValueCounter

  constructor(options: BetPanelOptions) {
    super()

    const valueWidth =
      BET_PANEL.width - BET_PANEL.padding * 2 - BET_PANEL.stepButton * 2 - BET_PANEL.gap * 2

    this.lower = this.createStepButton('–', options.onLower)
    this.raise = this.createStepButton('+', options.onRaise)

    this.value = new ValueCounter({
      label: 'BET',
      width: valueWidth,
      height: CONTENT_HEIGHT,
      format: formatMoney,
      labelColor: THEME.text,
      valueColor: THEME.accent,
      fontFamily: FONT_FAMILY,
    })

    const top = BET_PANEL.padding

    this.lower.position.set(BET_PANEL.padding, top)
    this.value.position.set(BET_PANEL.padding + BET_PANEL.stepButton + BET_PANEL.gap, top)
    this.raise.position.set(BET_PANEL.width - BET_PANEL.padding - BET_PANEL.stepButton, top)

    this.addChild(
      drawPanelBar(BET_PANEL.width, BET_PANEL.height, BET_PANEL.radius),
      this.lower,
      this.value,
      this.raise,
    )

    this.boundsArea = new Rectangle(0, 0, BET_PANEL.width, BET_PANEL.height)
  }

  setBet(bet: number): void {
    this.value.set(bet)
  }

  setState(state: ControlsState): void {
    // Ставку меняем только между спинами и вне автоигры.
    this.lower.setEnabled(state.canLowerBet)
    this.raise.setEnabled(state.canRaiseBet)
  }

  private createStepButton(label: string, onPress: () => void): Button {
    return new Button({
      width: BET_PANEL.stepButton,
      height: BET_PANEL.stepButton,
      label,
      fill: THEME.backdrop,
      textColor: THEME.accent,
      radius: 18,
      fontSize: 34,
      onPress,
    })
  }
}

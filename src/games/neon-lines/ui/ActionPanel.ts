import { Container, Rectangle } from 'pixi.js'
import { Button, ToggleButton } from '@sdk'
import { ACTIONS } from '../config/panel'
import { THEME } from '../config/theme'
import type { ControlsState } from '../state/controlsState'
import { drawPanelBar } from './panelBar'

export type ActionPanelOptions = {
  onSpinOrStop: () => void
  onToggleTurbo: (active: boolean) => void
  onToggleAutoplay: (active: boolean) => void
}

/** Блок действий: Spin, турбо и автоигра. */
export class ActionPanel extends Container {
  private readonly spin: Button
  private readonly turbo: ToggleButton
  private readonly autoplay: ToggleButton

  constructor(options: ActionPanelOptions) {
    super()

    const top = (ACTIONS.height - ACTIONS.rowHeight) / 2
    const spinLeft = ACTIONS.padding
    const turboLeft = spinLeft + ACTIONS.spinWidth + ACTIONS.gap
    const autoLeft = turboLeft + ACTIONS.toggleWidth + ACTIONS.gap

    this.spin = new Button({
      width: ACTIONS.spinWidth,
      height: ACTIONS.rowHeight,
      label: 'SPIN',
      fill: THEME.highlight,
      textColor: THEME.text,
      radius: 20,
      onPress: options.onSpinOrStop,
    })

    this.turbo = this.createToggle('TURBO', options.onToggleTurbo)
    this.autoplay = this.createToggle('AUTO', options.onToggleAutoplay)

    this.spin.position.set(spinLeft, top)
    this.turbo.position.set(turboLeft, top)
    this.autoplay.position.set(autoLeft, top)

    this.addChild(
      drawPanelBar(ACTIONS.width, ACTIONS.height, ACTIONS.radius),
      this.spin,
      this.turbo,
      this.autoplay,
    )

    this.boundsArea = new Rectangle(0, 0, ACTIONS.width, ACTIONS.height)
  }

  setState(state: ControlsState): void {
    // Одна кнопка на два действия: пока спин идёт, она работает как Stop.
    this.spin.setLabel(spinLabel(state))
    this.spin.setEnabled(state.canSpin || state.canStop)

    this.autoplay.setEnabled(state.canToggleAutoplay)
    // Автоигра может закончиться сама — например, когда кончились деньги.
    // Тогда кнопку нужно вернуть в исходное состояние.
    this.autoplay.setActive(state.autoplayActive)
  }

  private createToggle(label: string, onChange: (active: boolean) => void): ToggleButton {
    return new ToggleButton({
      width: ACTIONS.toggleWidth,
      height: ACTIONS.rowHeight,
      label,
      fill: THEME.surface,
      activeFill: THEME.accent,
      textColor: THEME.text,
      radius: 20,
      fontSize: ACTIONS.toggleFontSize,
      onChange,
    })
  }
}

function spinLabel(state: ControlsState): string {
  if (state.canStop) return 'STOP'
  if (state.outOfFunds) return 'NO FUNDS'
  return 'SPIN'
}

import { Button, type ButtonOptions } from './Button'

export type ToggleButtonOptions = Omit<ButtonOptions, 'onPress'> & {
  /** Цвет во включённом состоянии. Выключенное берётся из `fill`. */
  activeFill: number
  onChange: (active: boolean) => void
}

/** Кнопка с двумя состояниями: турбо, звук и прочие переключатели. */
export class ToggleButton extends Button {
  private readonly idleFill: number
  private readonly activeFill: number
  private readonly onChange: (active: boolean) => void
  private active = false

  constructor(options: ToggleButtonOptions) {
    super({ ...options, onPress: () => this.toggle() })

    this.idleFill = options.fill
    this.activeFill = options.activeFill
    this.onChange = options.onChange
  }

  get isActive(): boolean {
    return this.active
  }

  setActive(active: boolean): void {
    this.active = active
    this.setTint(active ? this.activeFill : this.idleFill)
  }

  private toggle(): void {
    this.setActive(!this.active)
    this.onChange(this.active)
  }
}

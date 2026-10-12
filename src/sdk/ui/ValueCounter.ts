import gsap from 'gsap'
import { Container, Rectangle, Text } from 'pixi.js'
import { tweenTo } from '../fx/animate'

export type ValueCounterOptions = {
  label: string
  width: number
  height: number
  /** Как превратить число в строку. Игра решает, деньги это или количество. */
  format: (value: number) => string
  labelColor: number
  valueColor: number
  fontFamily: string | string[]
}

const DEFAULT_SECONDS = 0.6

/**
 * Подпись и число под ней. Число умеет докручиваться до нового значения,
 * поэтому выигрыш виден как рост суммы, а не как мгновенная подмена цифр.
 */
export class ValueCounter extends Container {
  private readonly valueText: Text
  private readonly format: (value: number) => string

  /** Значение, которым двигает GSAP. В объекте — чтобы было видно, что мутирует анимация. */
  private readonly state = { value: 0 }

  constructor(options: ValueCounterOptions) {
    super()
    this.format = options.format

    const labelText = new Text({
      text: options.label,
      style: {
        fontFamily: options.fontFamily,
        fontSize: Math.round(options.height * 0.24),
        fontWeight: '500',
        fill: options.labelColor,
        letterSpacing: 2,
      },
    })
    labelText.anchor.set(0.5)
    labelText.position.set(options.width / 2, options.height * 0.27)

    this.valueText = new Text({
      text: this.format(0),
      style: {
        fontFamily: options.fontFamily,
        fontSize: Math.round(options.height * 0.42),
        fontWeight: '800',
        fill: options.valueColor,
      },
    })
    this.valueText.anchor.set(0.5)
    this.valueText.position.set(options.width / 2, options.height * 0.66)

    this.addChild(labelText, this.valueText)

    // Размер объявлен явно: раскладка не должна зависеть от длины числа,
    // иначе блок дёргался бы при каждом изменении суммы.
    this.boundsArea = new Rectangle(0, 0, options.width, options.height)
  }

  get value(): number {
    return this.state.value
  }

  /** Поставить значение сразу, без анимации. */
  set(value: number): void {
    gsap.killTweensOf(this.state)
    this.state.value = value
    this.render()
  }

  /** Докрутить до значения анимацией. */
  async animateTo(value: number, seconds = DEFAULT_SECONDS): Promise<void> {
    await tweenTo(this.state, {
      value,
      duration: seconds,
      ease: 'power2.out',
      overwrite: true,
      onUpdate: () => this.render(),
    })

    this.render()
  }

  private render(): void {
    this.valueText.text = this.format(this.state.value)
  }
}

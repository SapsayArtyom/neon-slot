import gsap from 'gsap'
import { Container, Graphics, Rectangle } from 'pixi.js'
import { tweenTo } from '../fx/animate'

/** Адрес клетки поля. */
export type GridCell = {
  column: number
  row: number
}

/** Одна подсветка: путь линии и клетки, которые по ней выиграли. */
export type WinHighlight = {
  /**
   * Путь линии: по одному номеру ряда на каждый пройденный барабан.
   * Игра сама решает, рисовать линию целиком или только выигравший отрезок.
   */
  path: readonly number[]
  cells: readonly GridCell[]
  color: number
}

export type WinOverlayOptions = {
  columns: number
  rows: number
  cellSize: number
  gap: number
  /**
   * Цвет рамок вокруг клеток — один на все клетки.
   *
   * Одна клетка может входить сразу в несколько линий. Если красить её в цвет
   * линии, та же клетка в соседней линии выглядела бы иначе, и это читалось бы
   * как ошибка, а не как подсказка. Цвет линии остаётся у самой линии.
   */
  cellColor: number
}

/**
 * Два слоя одной и той же линии: широкий полупрозрачный даёт свечение,
 * узкий яркий — её ядро. Дешёвая замена настоящему glow-фильтру.
 */
const LINE_LAYERS = [
  { width: 16, alpha: 0.22 },
  { width: 5, alpha: 0.95 },
]

const FADE_IN_SECONDS = 0.25
const FADE_OUT_SECONDS = 0.3

/**
 * Подсветка выигрышей поверх поля: линии выплат и рамки выигравших клеток.
 *
 * Про сами выигрыши не знает ничего — получает готовые пути и клетки,
 * поэтому одинаково годится и для линий, и для кластеров.
 */
export class WinOverlay extends Container {
  private readonly graphics = new Graphics()
  private readonly cellSize: number
  private readonly cellStep: number
  private readonly cellColor: number

  constructor(options: WinOverlayOptions) {
    super()
    this.cellSize = options.cellSize
    this.cellStep = options.cellSize + options.gap
    this.cellColor = options.cellColor

    this.addChild(this.graphics)
    this.alpha = 0

    // Подсветка лежит над барабанами и не должна перехватывать касания.
    this.eventMode = 'none'
    this.boundsArea = new Rectangle(
      0,
      0,
      options.columns * this.cellStep - options.gap,
      options.rows * this.cellStep - options.gap,
    )
  }

  /** Нарисовать подсветку. Видимой она станет после showAnimated(). */
  draw(highlights: readonly WinHighlight[]): void {
    this.graphics.clear()

    // Каждая клетка рисуется ровно один раз, даже если входит в несколько
    // линий: иначе полупрозрачные рамки складываются и такая клетка
    // выделяется яркостью среди остальных в той же линии.
    this.drawCells(uniqueWinCells(highlights))

    for (const highlight of highlights) this.drawLine(highlight)
  }

  async showAnimated(seconds = FADE_IN_SECONDS): Promise<void> {
    await tweenTo(this, { alpha: 1, duration: seconds, ease: 'power2.out', overwrite: true })
  }

  async hideAnimated(seconds = FADE_OUT_SECONDS): Promise<void> {
    await tweenTo(this, { alpha: 0, duration: seconds, ease: 'power2.in', overwrite: true })
    this.graphics.clear()
  }

  /** Убрать подсветку немедленно — начинается новый спин. */
  hide(): void {
    gsap.killTweensOf(this)
    this.alpha = 0
    this.graphics.clear()
  }

  private drawLine(highlight: WinHighlight): void {
    if (highlight.path.length < 2) return

    const points = highlight.path.map((row, column) => this.cellCenter(column, row))

    for (const layer of LINE_LAYERS) {
      points.forEach((point, index) => {
        if (index === 0) this.graphics.moveTo(point.x, point.y)
        else this.graphics.lineTo(point.x, point.y)
      })

      this.graphics.stroke({
        width: layer.width,
        color: highlight.color,
        alpha: layer.alpha,
        cap: 'round',
        join: 'round',
      })
    }
  }

  private drawCells(cells: readonly GridCell[]): void {
    const inset = 4

    for (const cell of cells) {
      this.graphics
        .roundRect(
          cell.column * this.cellStep + inset,
          cell.row * this.cellStep + inset,
          this.cellSize - inset * 2,
          this.cellSize - inset * 2,
          14,
        )
        .fill({ color: this.cellColor, alpha: 0.12 })
        .stroke({ width: 4, color: this.cellColor, alpha: 0.9 })
    }
  }

  private cellCenter(column: number, row: number): { x: number; y: number } {
    return {
      x: column * this.cellStep + this.cellSize / 2,
      y: row * this.cellStep + this.cellSize / 2,
    }
  }
}

/**
 * Клетки всех подсветок без повторов, в порядке первого появления.
 * Нужна, потому что выигрышные линии пересекаются и делят клетки.
 */
function uniqueWinCells(highlights: readonly WinHighlight[]): GridCell[] {
  const seen = new Set<string>()
  const cells: GridCell[] = []

  for (const highlight of highlights) {
    for (const cell of highlight.cells) {
      const key = `${cell.column}:${cell.row}`
      if (seen.has(key)) continue

      seen.add(key)
      cells.push(cell)
    }
  }

  return cells
}

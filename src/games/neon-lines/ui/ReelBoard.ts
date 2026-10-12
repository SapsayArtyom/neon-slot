import { Container, Rectangle } from 'pixi.js'
import { ReelSet, WinOverlay, type GridCell, type SymbolView } from '@sdk'
import { GRID } from '../config/grid'
import { BOARD } from '../config/panel'
import { spinningSymbol } from '../config/reels'
import { THEME } from '../config/theme'
import { WILD } from '../config/symbols'
import { drawPanelBar } from './panelBar'

export type ReelBoardOptions = {
  createSymbolView: () => SymbolView
}

/** Насколько приглушены рамки залипших Wild, чтобы не спорить с подсветкой выигрышей. */
const STICKY_ALPHA = 0.7

/**
 * Игровое поле: рамка, барабаны и два слоя подсветки над ними.
 *
 * Слоёв два, потому что они живут по разным правилам: залипшие Wild держатся
 * весь раунд фриспинов, а подсветка выигрыша появляется и гаснет на каждом
 * спине. Оба — один и тот же компонент SDK: ему всё равно, что подсвечивать.
 */
export class ReelBoard extends Container {
  readonly reels: ReelSet
  readonly overlay: WinOverlay
  private readonly stickyWilds: WinOverlay

  constructor(options: ReelBoardOptions) {
    super()

    const geometry = {
      columns: GRID.columns,
      rows: GRID.rows,
      cellSize: GRID.cellSize,
      gap: GRID.gap,
    }

    this.reels = new ReelSet({
      ...geometry,
      createSymbolView: options.createSymbolView,
      randomSymbol: spinningSymbol,
    })
    // Выигрыши обводятся светлым, залипшие Wild — золотым: два слоя не должны
    // сливаться, когда во фриспинах видны оба сразу.
    this.overlay = new WinOverlay({ ...geometry, cellColor: THEME.text })
    this.stickyWilds = new WinOverlay({ ...geometry, cellColor: THEME.gold })

    // Барабаны и оба слоя подсветки живут в одной системе координат внутри рамки.
    for (const layer of [this.reels, this.stickyWilds, this.overlay]) {
      layer.position.set(GRID.padding, GRID.padding)
    }

    this.addChild(
      drawPanelBar(BOARD.width, BOARD.height, BOARD.radius),
      this.reels,
      this.stickyWilds,
      this.overlay,
    )
    this.boundsArea = new Rectangle(0, 0, BOARD.width, BOARD.height)
  }

  /** Отметить клетки, где Wild залип до конца раунда. */
  showStickyWilds(cells: readonly GridCell[]): void {
    if (cells.length === 0) {
      this.stickyWilds.hide()
      return
    }

    // Закрепляем сами символы: иначе рамка стояла бы на месте, а символ под
    // ней прокручивался бы вместе с лентой.
    this.reels.setLocks(cells.map((cell) => ({ ...cell, symbol: WILD })))

    // Без анимации: маркеры появляются вместе с остановкой барабанов,
    // а прозрачность постоянная, чтобы они не спорили с подсветкой выигрыша.
    this.stickyWilds.draw([{ path: [], cells, color: THEME.gold }])
    this.stickyWilds.alpha = STICKY_ALPHA
  }

  hideStickyWilds(): void {
    this.reels.clearLocks()
    this.stickyWilds.hide()
  }
}

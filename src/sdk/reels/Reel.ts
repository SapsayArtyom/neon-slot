import gsap from 'gsap'
import { Container } from 'pixi.js'
import type { SymbolId } from '../api/types'
import type { SymbolView } from './SymbolView'

/** Запас клеток над окном: по нему барабан проскакивает цель при отскоке. */
const BUFFER_ROWS = 2

/**
 * На сколько клеток путь остановки длиннее высоты окна.
 *
 * Должно быть не меньше 1. Целевые символы подкладываются выше окна, и они не
 * должны попасть на клетки, которые игрок видит в момент начала остановки —
 * иначе символы в окне заметно подменятся на глазах.
 */
const TRAVEL_MARGIN = 2

/** Отскок в конце приземления: барабан проскакивает цель и возвращается. */
const LANDING_EASE = 'back.out(1.1)'

/** Заведомо больше любого спина: свободная прокрутка не должна закончиться сама. */
const SPIN_CELLS = 10_000

export type ReelOptions = {
  rows: number
  cellSize: number
  gap: number
  createSymbolView: () => SymbolView
  /** Чем заполнять клетки во время свободной прокрутки. */
  randomSymbol: () => SymbolId
}

/**
 * Один барабан: вертикальная лента символов.
 *
 * У движения два разных режима, и у каждого свой источник.
 *
 * Свободная прокрутка идёт по `position` — это счётчик пройденных клеток,
 * который растёт непрерывно. Когда его целая часть увеличивается, нижняя клетка
 * уезжает наверх и получает случайный символ: лента выглядит бесконечной.
 *
 * Остановка идёт по `offset` и ничего не перекладывает. Целевые символы
 * заранее подкладываются выше окна — туда, где они окажутся, когда лента
 * пройдёт путь остановки. Поэтому приземление — это один твин GSAP, и отскок
 * в его конце не рискует вытолкнуть цель из окна.
 */
export class Reel {
  readonly view = new Container()

  private readonly cells: SymbolView[] = []
  private readonly cellStep: number
  private readonly travelCells: number
  /** Сколько клеток держится над окном. */
  private readonly topPad: number
  private readonly randomSymbol: () => SymbolId

  /** Значения, которыми двигает GSAP. В объекте — чтобы было видно, что мутирует анимация. */
  private readonly motion = { offset: 0, position: 0 }

  /**
   * Закреплённые символы: отдельный слой поверх ленты, по одному объекту на
   * ряд окна. Они не участвуют в прокрутке — именно так ведут себя залипшие
   * символы, которые должны стоять на месте, пока лента идёт за ними.
   */
  private readonly lockViews: SymbolView[] = []
  private readonly locks = new Map<number, SymbolId>()

  private spinTween: gsap.core.Tween | null = null
  /** Сколько клеток уже подано сверху за текущую прокрутку. */
  private fedCells = 0

  constructor(options: ReelOptions) {
    this.cellStep = options.cellSize + options.gap
    this.travelCells = options.rows + TRAVEL_MARGIN
    this.topPad = this.travelCells + BUFFER_ROWS
    this.randomSymbol = options.randomSymbol

    for (let index = 0; index < options.rows + this.topPad; index += 1) {
      const view = options.createSymbolView()
      view.setSymbol(this.randomSymbol())
      this.cells.push(view)
      this.view.addChild(view)
    }

    // Слой закреплённых добавляется после ленты, поэтому рисуется поверх неё.
    for (let row = 0; row < options.rows; row += 1) {
      const view = options.createSymbolView()
      view.y = row * this.cellStep
      view.visible = false
      this.lockViews.push(view)
      this.view.addChild(view)
    }

    this.layoutCells()
  }

  /**
   * Закрепляет символы в указанных рядах окна: они перестают крутиться.
   * Повторный вызов полностью заменяет набор закреплённых.
   */
  setLocks(locks: ReadonlyMap<number, SymbolId>): void {
    this.restoreLockedSymbols()
    this.locks.clear()

    this.lockViews.forEach((view, row) => {
      const symbol = locks.get(row)
      view.visible = symbol !== undefined

      if (symbol === undefined) return
      this.locks.set(row, symbol)
      view.setSymbol(symbol)
    })
  }

  /** Снимает закрепление и возвращает закреплённые символы в саму ленту. */
  clearLocks(): void {
    this.restoreLockedSymbols()
    this.locks.clear()

    for (const view of this.lockViews) view.visible = false
  }

  /**
   * Возвращает закреплённые символы в саму ленту.
   *
   * Под закреплёнными в ленте лежат случайные подстановки (см. stripSymbolFor).
   * Если просто убрать слой, они бы вылезли наружу вместо настоящих символов.
   * Вызывается до любой смены набора закреплений, а не только при снятии:
   * ряд может перестать быть закреплённым.
   */
  private restoreLockedSymbols(): void {
    const firstVisible = this.windowStartIndex()

    for (const [row, symbol] of this.locks) {
      this.cells[firstVisible + row]?.setSymbol(symbol)
    }
  }

  /** Мгновенно показать символы в окне. Текущая анимация прерывается. */
  showSymbols(symbols: readonly SymbolId[]): void {
    this.killSpin()
    this.motion.offset = 0
    this.motion.position = 0
    this.fedCells = 0

    // Клетки над окном заполняются случайно: их всё равно не видно.
    this.cells.forEach((view, index) => {
      const row = index - this.topPad
      view.setSymbol(this.stripSymbolFor(row, symbols[row]))
    })

    this.layoutCells()
  }

  startSpin(cellsPerSecond: number): void {
    this.killSpin()

    this.spinTween = gsap.to(this.motion, {
      position: this.motion.position + SPIN_CELLS,
      duration: SPIN_CELLS / cellsPerSecond,
      ease: 'none',
      onUpdate: () => this.syncToPosition(),
    })
  }

  /**
   * Добавляет приземление этого барабана в общий таймлайн остановки.
   *
   * Барабан не создаёт твин сам: все приземления живут в одном таймлайне
   * ReelSet, поэтому ускорить остановку можно одним timeScale.
   */
  addLandingTo(
    timeline: gsap.core.Timeline,
    target: readonly SymbolId[],
    duration: number,
    startAt: number,
  ): void {
    timeline.to(
      this.motion,
      {
        offset: this.travelCells * this.cellStep,
        duration,
        ease: LANDING_EASE,
        onStart: () => this.prepareLanding(target),
        onUpdate: () => this.layoutCells(),
        onComplete: () => this.showSymbols(target),
      },
      startAt,
    )
  }

  killSpin(): void {
    this.spinTween?.kill()
    this.spinTween = null
  }

  /**
   * Свободная прокрутка прекращается, а целевые символы подкладываются выше
   * окна. Клетки, которые игрок видит сейчас, не трогаются.
   */
  private prepareLanding(target: readonly SymbolId[]): void {
    this.killSpin()

    // Самая верхняя клетка окна видна частично, поэтому до неё не доходим.
    const lastHiddenCell = this.topPad - 2

    for (let index = 0; index <= lastHiddenCell; index += 1) {
      const row = index - BUFFER_ROWS
      this.cells[index]!.setSymbol(this.stripSymbolFor(row, target[row]))
    }
  }

  private syncToPosition(): void {
    const passedCells = Math.floor(this.motion.position)

    // Цикл, а не if: при просадке кадров за один шаг проходит больше клетки.
    while (this.fedCells < passedCells) {
      this.fedCells += 1
      this.feedTopCell()
    }

    this.motion.offset = (this.motion.position - passedCells) * this.cellStep
    this.layoutCells()
  }

  /** Нижняя клетка уезжает наверх и получает новый символ. */
  private feedTopCell(): void {
    const view = this.cells.pop()
    if (!view) return

    this.cells.unshift(view)
    view.setSymbol(this.randomSymbol())
  }

  /** Индекс клетки ленты, стоящей сейчас в верхнем ряду окна. */
  private windowStartIndex(): number {
    return this.topPad - Math.round(this.motion.offset / this.cellStep)
  }

  /**
   * Какой символ положить в ленту для указанного ряда окна.
   *
   * В закреплённых рядах лента получает случайный символ: настоящий всё равно
   * не виден под закреплённым слоем, а положи его и туда — при отскоке он
   * раздвоился бы, потому что лента смещается, а закреплённый слой нет.
   */
  private stripSymbolFor(row: number, target: SymbolId | undefined): SymbolId {
    if (target === undefined || this.locks.has(row)) return this.randomSymbol()
    return target
  }

  private layoutCells(): void {
    this.cells.forEach((view, index) => {
      view.y = (index - this.topPad) * this.cellStep + this.motion.offset
    })
  }
}

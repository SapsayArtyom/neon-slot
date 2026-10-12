import gsap from 'gsap'
import { Container, Graphics, Rectangle } from 'pixi.js'
import type { Grid, SymbolId } from '../api/types'
import { Reel } from './Reel'
import type { SymbolView } from './SymbolView'
import type { GridCell } from './WinOverlay'

/** Клетка, символ в которой закреплён и не крутится вместе с лентой. */
export type LockedSymbol = GridCell & {
  symbol: SymbolId
}

/** Как именно барабаны приходят к остановке. */
export type StopProfile = {
  /** Сколько секунд занимает остановка всех барабанов целиком. */
  duration: number
  /**
   * Какая доля этого времени уходит на разбег между соседними барабанами.
   * Остальное достаётся приземлению каждого отдельного барабана.
   * Ноль означает, что разбега нет и все барабаны встают одновременно.
   */
  staggerShare: number
}

export type ReelTiming = {
  /** Скорость свободной прокрутки, клеток в секунду. */
  spinSpeed: number
  /** Обычная остановка: барабаны встают по очереди слева направо. */
  normalStop: StopProfile
  /** Турбо: барабаны встают одновременно и почти сразу. */
  turboStop: StopProfile
  /**
   * В этот бюджет ужимается уже начатая остановка, когда нажали Stop.
   * Это не отдельный профиль: разбег сохраняется, просто всё идёт быстрее.
   */
  stopButtonSeconds: number
}

const DEFAULT_TIMING: ReelTiming = {
  spinSpeed: 16,
  normalStop: { duration: 1.6, staggerShare: 0.45 },
  turboStop: { duration: 0.28, staggerShare: 0 },
  stopButtonSeconds: 1,
}

export type ReelSetOptions = {
  columns: number
  rows: number
  cellSize: number
  gap: number
  createSymbolView: () => SymbolView
  /** Чем заполнять барабан во время прокрутки. Номер барабана — слева направо. */
  randomSymbol: (column: number) => SymbolId
  /** Профили заменяются целиком, а не по отдельным полям. */
  timing?: Partial<ReelTiming>
}

/**
 * Набор барабанов: прокрутка и последовательная остановка слева направо.
 *
 * Все приземления складываются в один таймлайн GSAP. Благодаря этому вся
 * остановка настраивается одним числом — сколько секунд она длится, — а кнопка
 * Stop не обрывает её, а доигрывает быстрее через timeScale.
 */
export class ReelSet extends Container {
  private readonly reels: Reel[] = []
  private readonly timing: ReelTiming
  private stopTimeline: gsap.core.Timeline | null = null
  private turbo = false

  constructor(options: ReelSetOptions) {
    super()
    this.timing = { ...DEFAULT_TIMING, ...options.timing }

    const cellStep = options.cellSize + options.gap
    const windowWidth = options.columns * cellStep - options.gap
    const windowHeight = options.rows * cellStep - options.gap

    for (let column = 0; column < options.columns; column += 1) {
      const reel = new Reel({
        rows: options.rows,
        cellSize: options.cellSize,
        gap: options.gap,
        createSymbolView: options.createSymbolView,
        randomSymbol: () => options.randomSymbol(column),
      })

      reel.view.x = column * cellStep
      this.reels.push(reel)
      this.addChild(reel.view)
    }

    // Окно барабанов: всё, что выше и ниже, скрыто одной маской на весь набор.
    const mask = new Graphics().rect(0, 0, windowWidth, windowHeight).fill(0xffffff)
    this.addChild(mask)
    this.mask = mask

    // Размер набора равен окну и не зависит от того, где сейчас лента,
    // поэтому раскладка не дёргается во время прокрутки.
    this.boundsArea = new Rectangle(0, 0, windowWidth, windowHeight)
  }

  /** Турбо: следующая остановка пойдёт по турбо-профилю. */
  setTurbo(enabled: boolean): void {
    this.turbo = enabled
  }

  /**
   * Закрепляет символы в указанных клетках: они стоят на месте, пока лента
   * крутится за ними. Так ведут себя залипшие Wild во фриспинах.
   * Повторный вызов полностью заменяет набор закреплённых.
   */
  setLocks(locked: readonly LockedSymbol[]): void {
    this.reels.forEach((reel, column) => {
      const forReel = new Map<number, SymbolId>()

      for (const lock of locked) {
        if (lock.column === column) forReel.set(lock.row, lock.symbol)
      }

      reel.setLocks(forReel)
    })
  }

  /** Снимает все закрепления, возвращая символы в ленты. */
  clearLocks(): void {
    for (const reel of this.reels) reel.clearLocks()
  }

  /** Мгновенно выставить поле, без анимации. */
  showGrid(grid: Grid): void {
    this.killStop()
    this.reels.forEach((reel, column) => reel.showSymbols(grid[column] ?? []))
  }

  startSpin(): void {
    this.killStop()
    for (const reel of this.reels) reel.startSpin(this.timing.spinSpeed)
  }

  /**
   * Останавливает барабаны на заданном поле.
   * В обычном режиме — по очереди слева направо, в турбо — все разом.
   */
  async stopAt(grid: Grid): Promise<void> {
    const profile = this.turbo ? this.timing.turboStop : this.timing.normalStop
    const gaps = Math.max(this.reels.length - 1, 1)
    const stagger = (profile.duration * profile.staggerShare) / gaps

    // Последний барабан стартует позже всех и должен успеть в общий бюджет.
    const landing = profile.duration - stagger * (this.reels.length - 1)

    const timeline = gsap.timeline()
    this.reels.forEach((reel, column) => {
      reel.addLandingTo(timeline, grid[column] ?? [], landing, column * stagger)
    })
    this.stopTimeline = timeline

    await timeline.then()
    this.stopTimeline = null
  }

  /**
   * Доигрывает начатую остановку по быстрому таймингу — нажата кнопка Stop.
   * Остановка не обрывается, а ускоряется, поэтому барабаны всё равно
   * встают плавно и с отскоком.
   */
  hurryStop(): void {
    const timeline = this.stopTimeline
    if (!timeline) return

    const remaining = timeline.duration() - timeline.time()

    // В турбо остановка и так короче бюджета — ускорять нечего.
    if (remaining <= this.timing.stopButtonSeconds) return

    timeline.timeScale(remaining / this.timing.stopButtonSeconds)
  }

  private killStop(): void {
    this.stopTimeline?.kill()
    this.stopTimeline = null
  }
}

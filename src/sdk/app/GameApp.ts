import { Application, UPDATE_PRIORITY, type Ticker } from 'pixi.js'
import { advanceAnimations, takeOverAnimationClock } from '../fx/clock'
import { SceneManager } from '../scene/SceneManager'
import { measureViewport, type Viewport } from './viewport'

export type GameAppOptions = {
  /** DOM-элемент, внутрь которого добавится canvas. Должен иметь размеры. */
  parent: HTMLElement
  /** Цвет фона страницы под сценой. */
  background: number
}

/** Выше этого значения прирост качества не виден, а нагрузка на мобильный GPU растёт. */
const MAX_RESOLUTION = 2

/**
 * Запускает Pixi, держит игровой цикл и следит за размерами окна.
 *
 * Весь кадр собран в одном месте и читается сверху вниз:
 *   проверка размеров -> раскладка -> анимации GSAP -> обновление сцены -> рендер
 */
export class GameApp {
  readonly pixi: Application
  readonly scenes: SceneManager

  private readonly parent: HTMLElement
  private currentViewport: Viewport
  private safeAreaOutdated = false
  /** Время с запуска игры: именно его получает GSAP. */
  private elapsedSeconds = 0

  private constructor(pixi: Application, parent: HTMLElement, viewport: Viewport) {
    this.pixi = pixi
    this.parent = parent
    this.currentViewport = viewport
    this.scenes = new SceneManager(pixi.stage, viewport)
  }

  get viewport(): Viewport {
    return this.currentViewport
  }

  static async start(options: GameAppOptions): Promise<GameApp> {
    const viewport = measureViewport(options.parent)
    const pixi = new Application()

    await pixi.init({
      width: viewport.width,
      height: viewport.height,
      background: options.background,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, MAX_RESOLUTION),
      autoDensity: true,
    })

    options.parent.appendChild(pixi.canvas)

    // До создания первой анимации: дальше временем GSAP управляем мы.
    takeOverAnimationClock()

    const app = new GameApp(pixi, options.parent, viewport)

    // Приоритет HIGH обязателен: Pixi добавляет свой рендер с приоритетом LOW,
    // поэтому раскладка успевает перестроиться до отрисовки этого же кадра.
    // Если сделать наоборот, после каждого изменения размера мелькнёт пустой кадр.
    pixi.ticker.add(app.onTick, undefined, UPDATE_PRIORITY.HIGH)

    // Поворот на 180 градусов меняет системные отступы, не меняя размеров экрана,
    // поэтому это единственный случай, когда safe-area нужно перечитать принудительно.
    window.addEventListener('orientationchange', () => {
      app.safeAreaOutdated = true
    })

    return app
  }

  /**
   * Размер проверяется каждый кадр, а не по событию resize.
   *
   * Так ловятся все источники изменений разом: обычный ресайз окна, поворот
   * устройства (браузер сообщает новые размеры с задержкой) и съезжающая
   * адресная строка мобильного браузера, которая события вообще не присылает.
   * Взамен не нужны ни подписки, ни их объединение, ни защита от устаревших размеров.
   */
  private syncViewport(): void {
    const width = this.parent.clientWidth
    const height = this.parent.clientHeight

    // Нулевой размер бывает, пока элемент скрыт: перестраивать нечего.
    if (width === 0 || height === 0) return

    const sizeChanged =
      width !== this.currentViewport.width || height !== this.currentViewport.height
    if (!sizeChanged && !this.safeAreaOutdated) return

    this.safeAreaOutdated = false
    this.currentViewport = measureViewport(this.parent)
    this.pixi.renderer.resize(width, height)
    this.scenes.resize(this.currentViewport)
  }

  private readonly onTick = (ticker: Ticker): void => {
    const dt = ticker.deltaMS / 1000

    this.syncViewport()

    this.elapsedSeconds += dt
    advanceAnimations(this.elapsedSeconds)

    this.scenes.update(dt)
  }
}

import type { Container } from 'pixi.js'
import type { Viewport } from '../app/viewport'
import type { Scene } from './Scene'

/** Держит одну активную сцену и передаёт ей кадры и события resize. */
export class SceneManager {
  private current: Scene | null = null

  constructor(
    private readonly stage: Container,
    private viewport: Viewport,
  ) {}

  /** Уничтожает текущую сцену и показывает новую. */
  async goTo(scene: Scene): Promise<void> {
    if (this.current) {
      this.current.onExit()
      this.stage.removeChild(this.current.view)
      this.current.view.destroy({ children: true })
    }

    this.current = scene
    this.stage.addChild(scene.view)
    await scene.onEnter()

    // Первая раскладка сразу после построения — сцене не нужно знать размеры заранее.
    scene.resize(this.viewport)
  }

  update(dt: number): void {
    this.current?.update(dt)
  }

  resize(viewport: Viewport): void {
    this.viewport = viewport
    this.current?.resize(viewport)
  }
}

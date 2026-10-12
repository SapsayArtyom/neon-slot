import { Container } from 'pixi.js'
import type { Viewport } from '../app/viewport'

/**
 * Экран игры: загрузка, основная игра, и т.д.
 *
 * Сцена одноразовая: SceneManager уничтожает её при переходе на другую сцену,
 * поэтому повторно показать тот же экземпляр нельзя — создайте новый.
 */
export abstract class Scene {
  /** Корень сцены. SceneManager сам добавляет его на stage и убирает оттуда. */
  readonly view = new Container()

  /** Сцена стала активной. Здесь строят содержимое; можно вернуть Promise. */
  onEnter(): void | Promise<void> {}

  /** Сцену сейчас уничтожат. Здесь останавливают таймеры и подписки. */
  onExit(): void {}

  /** Каждый кадр. `dt` — секунды, прошедшие с прошлого кадра. */
  update(_dt: number): void {}

  /** Размер окна или ориентация изменились — пора пересобрать раскладку. */
  resize(_viewport: Viewport): void {}
}

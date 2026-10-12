import { loadAssets, onKeyPress, type GameApp, type GameDefinition } from '@sdk'
import { MockSpinService } from './api/MockSpinService'
import { GAME_ASSETS } from './config/assets'
import { THEME } from './config/theme'
import { GameScene } from './scenes/GameScene'
import { LoadingScene } from './scenes/LoadingScene'
import { SymbolSprite } from './view/SymbolSprite'
import { createSymbolTextures } from './view/symbolTextures'

/**
 * Сборка игры: всё, что знает именно об этой игре, собрано здесь.
 *
 * Порядок важен. Сначала ресурсы, потом текстуры символов, и только затем
 * сцена: Pixi измеряет текст при создании, поэтому подписи и текстуры должны
 * сразу получить загруженный шрифт — иначе они «прыгнут» после подмены.
 */
async function start(app: GameApp): Promise<void> {
  const loading = new LoadingScene()
  await app.scenes.goTo(loading)
  await loadAssets(GAME_ASSETS, (progress) => loading.setProgress(progress))

  // Символы рисуются в текстуры один раз на старте: для этого нужен рендерер,
  // поэтому раньше этого момента их создать нельзя.
  const textures = createSymbolTextures(app.pixi.renderer)

  const game = new GameScene({
    createSymbolView: () => new SymbolSprite(textures),
    service: new MockSpinService(),
  })
  await app.scenes.goTo(game)

  // Привязка клавиш здесь, а не в сцене: сцена строит картинку, а глобальный
  // ввод — такая же часть обвязки браузера, как рендерер.
  // Подписка не снимается: игра живёт столько же, сколько страница.
  onKeyPress('Space', () => game.spinOrStop())
}

export const neonLines = {
  background: THEME.backdrop,
  start,
} satisfies GameDefinition

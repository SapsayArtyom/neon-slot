import { GameApp } from '@sdk'
import { neonLines } from './games/neon-lines'

/**
 * Точка входа в браузере.
 *
 * Единственное место, где игра названа по имени: чтобы запустить другую,
 * достаточно поменять один импорт. Ни про символы, ни про ресурсы, ни про
 * сцены здесь ничего не известно — всё это описывает сама игра.
 */
async function main(): Promise<void> {
  const parent = document.getElementById('game-root')
  if (!parent) throw new Error('В index.html нет элемента #game-root')

  const app = await GameApp.start({ parent, background: neonLines.background })
  await neonLines.start(app)
}

main().catch((error: unknown) => {
  console.error('Не удалось запустить игру:', error)
})

import type { AssetManifest } from '@sdk'

/**
 * Ресурсы игры.
 *
 * Чтобы подключить новый файл, достаточно дописать сюда строку: загрузка,
 * прогресс и ожидание берутся из SDK. Пути указаны без ведущего слеша,
 * поэтому сборка работает и в корне домена, и в подпапке.
 */
export const GAME_ASSETS: AssetManifest = [
  {
    alias: 'font-display',
    src: 'assets/fonts/orbitron.woff2',
    // Orbitron переменный, поэтому оба веса регистрируются из одного файла.
    data: { family: 'Orbitron', weights: ['500', '800'] },
  },
]

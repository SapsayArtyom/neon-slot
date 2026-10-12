import { Assets } from 'pixi.js'

/** Один подключаемый файл. */
export type AssetEntry = {
  /** Имя, по которому ресурс потом запрашивается из кода. */
  alias: string
  /** Путь относительно корня сайта, без ведущего слеша — тогда сборка работает и в подпапке. */
  src: string
  /** Параметры загрузчика Pixi. Например, для шрифта — семейство и веса. */
  data?: Record<string, unknown>
}

/**
 * Список ресурсов игры. Это обычные данные, поэтому подключить новый файл —
 * значит дописать одну строку в манифест игры.
 */
export type AssetManifest = readonly AssetEntry[]

/**
 * Грузит всё из манифеста и сообщает прогресс числом от 0 до 1.
 * Пока ресурсы не загружены, игру показывать нельзя: шрифты и текстуры
 * нужны уже при создании сцены.
 */
export async function loadAssets(
  manifest: AssetManifest,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  if (manifest.length === 0) {
    onProgress?.(1)
    return
  }

  Assets.add(manifest.map(({ alias, src, data }) => ({ alias, src, data })))
  await Assets.load(
    manifest.map((entry) => entry.alias),
    onProgress,
  )
}

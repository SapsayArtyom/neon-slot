/**
 * Публичный API SDK. Игра импортирует только отсюда: `import { ... } from '@sdk'`.
 *
 * Правило границы: SDK не знает ничего о конкретной игре — ни символов,
 * ни таблицы выплат, ни правил. Всё это приходит из игры через конфиг.
 * Правило проверяется линтером (см. eslint.config.js).
 */

export { GameApp, type GameAppOptions } from './app/GameApp'
export type { GameDefinition } from './app/GameDefinition'
export {
  measureViewport,
  safeAreaRect,
  screenRect,
  type Insets,
  type Orientation,
  type Viewport,
} from './app/viewport'

export { Scene } from './scene/Scene'
export { SceneManager } from './scene/SceneManager'

export { applyLayout, place } from './layout/place'
export type { LayoutScheme, Placement } from './layout/types'

export { tweenTo } from './fx/animate'

export { loadAssets, type AssetEntry, type AssetManifest } from './assets/loadAssets'

export type { Grid, SpinOutcome, SpinRequest, SpinService, SymbolId } from './api/types'
export { createRandom, delay, randomInt, shuffle } from './api/random'

export { Reel, type ReelOptions } from './reels/Reel'
export { ReelSet, type ReelSetOptions, type ReelTiming, type StopProfile } from './reels/ReelSet'
export type { SymbolView } from './reels/SymbolView'
export {
  WinOverlay,
  type GridCell,
  type WinHighlight,
  type WinOverlayOptions,
} from './reels/WinOverlay'

export {
  SpinController,
  type SpinControllerOptions,
  type SpinPhase,
  type SpinState,
} from './flow/SpinController'

export { Button, type ButtonOptions } from './ui/Button'
export { onKeyPress } from './ui/keyboard'
export { ToggleButton, type ToggleButtonOptions } from './ui/ToggleButton'
export { ValueCounter, type ValueCounterOptions } from './ui/ValueCounter'

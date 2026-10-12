import type { Container } from 'pixi.js'
import type { Viewport } from '../app/viewport'
import { safeAreaRect, screenRect } from '../app/viewport'
import type { LayoutScheme, Placement } from './types'

/** Ставит один объект на экран по описанию Placement. */
export function place(node: Container, placement: Placement, viewport: Viewport): void {
  const area = placement.area === 'screen' ? screenRect(viewport) : safeAreaRect(viewport)

  // Размер измеряем в собственных координатах объекта, без учёта прошлого масштаба,
  // иначе каждый resize масштабировал бы объект повторно.
  node.scale.set(1)
  const bounds = node.getLocalBounds()
  if (bounds.width === 0 || bounds.height === 0) return

  const scale = resolveScale(placement, bounds.width, bounds.height, area)
  node.scale.set(scale)

  const anchorX = placement.anchorX ?? 0.5
  const anchorY = placement.anchorY ?? 0.5

  // Сдвигаем объект так, чтобы его точка привязки оказалась в целевой точке экрана.
  node.x = area.x + placement.x * area.width - (bounds.x + anchorX * bounds.width) * scale
  node.y = area.y + placement.y * area.height - (bounds.y + anchorY * bounds.height) * scale
}

function resolveScale(
  placement: Placement,
  width: number,
  height: number,
  area: { width: number; height: number },
): number {
  // Если заданы оба ограничения, берём меньший масштаб — объект влезает в оба.
  const limits: number[] = []
  if (placement.fitWidth !== undefined) limits.push((placement.fitWidth * area.width) / width)
  if (placement.fitHeight !== undefined) limits.push((placement.fitHeight * area.height) / height)

  const fitted = limits.length > 0 ? Math.min(...limits) : 1
  return fitted * (placement.scale ?? 1)
}

/**
 * Ставит сразу все объекты сцены по её раскладке.
 * Один вызов в Scene.resize() — и экран перестроен под новую ориентацию.
 */
export function applyLayout<Key extends string>(
  scheme: LayoutScheme<Key>,
  viewport: Viewport,
  nodes: Record<Key, Container>,
): void {
  for (const key of Object.keys(nodes) as Key[]) {
    place(nodes[key], scheme[key][viewport.orientation], viewport)
  }
}

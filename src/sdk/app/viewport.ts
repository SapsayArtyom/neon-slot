/** Ориентация экрана. Определяется по пропорциям, а не по событию устройства. */
export type Orientation = 'portrait' | 'landscape'

/** Отступы, которые занимает системный интерфейс устройства (челка, домашняя полоса). */
export type Insets = {
  top: number
  right: number
  bottom: number
  left: number
}

/** Размеры области игры на текущем кадре. Пересчитывается при любом resize. */
export type Viewport = {
  width: number
  height: number
  orientation: Orientation
  safeArea: Insets
}

/**
 * Невидимый элемент-щуп: единственный способ прочитать значения env(safe-area-inset-*)
 * из JavaScript — задать их как padding и запросить вычисленный стиль.
 */
let safeAreaProbe: HTMLDivElement | null = null

function readSafeArea(): Insets {
  if (!safeAreaProbe) {
    safeAreaProbe = document.createElement('div')
    safeAreaProbe.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'visibility:hidden',
      'pointer-events:none',
      'padding-top:env(safe-area-inset-top)',
      'padding-right:env(safe-area-inset-right)',
      'padding-bottom:env(safe-area-inset-bottom)',
      'padding-left:env(safe-area-inset-left)',
    ].join(';')
    document.body.appendChild(safeAreaProbe)
  }

  const style = getComputedStyle(safeAreaProbe)
  return {
    top: parseFloat(style.paddingTop) || 0,
    right: parseFloat(style.paddingRight) || 0,
    bottom: parseFloat(style.paddingBottom) || 0,
    left: parseFloat(style.paddingLeft) || 0,
  }
}

/** Снимает текущие размеры контейнера игры. */
export function measureViewport(parent: HTMLElement): Viewport {
  const width = parent.clientWidth || window.innerWidth
  const height = parent.clientHeight || window.innerHeight

  return {
    width,
    height,
    orientation: width >= height ? 'landscape' : 'portrait',
    safeArea: readSafeArea(),
  }
}

/** Прямоугольник экрана без системных отступов — в нём размещают всё управление. */
export function safeAreaRect(viewport: Viewport): {
  x: number
  y: number
  width: number
  height: number
} {
  const { safeArea } = viewport
  return {
    x: safeArea.left,
    y: safeArea.top,
    width: viewport.width - safeArea.left - safeArea.right,
    height: viewport.height - safeArea.top - safeArea.bottom,
  }
}

/** Прямоугольник всего экрана, включая области под системным интерфейсом. */
export function screenRect(viewport: Viewport): {
  x: number
  y: number
  width: number
  height: number
} {
  return { x: 0, y: 0, width: viewport.width, height: viewport.height }
}

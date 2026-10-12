import { Container, Graphics, Text, type Renderer, type Texture } from 'pixi.js'
import { FONT_FAMILY } from '../config/fonts'
import { GRID } from '../config/grid'
import { SYMBOL_IDS, SYMBOLS, type NeonSymbolId, type SymbolInfo } from '../config/symbols'
import { THEME } from '../config/theme'

/** Текстуры рисуются с удвоенным разрешением, чтобы не мылились на экранах Retina. */
const TEXTURE_RESOLUTION = 2

/**
 * Рисует каждый символ один раз и превращает в текстуру.
 *
 * Во время прокрутки символы меняются десятки раз в секунду. Перерисовывать
 * графику и текст на каждой смене дорого, а подменить текстуру спрайта — нет.
 * На следующем этапе сюда же подставится готовый спрайтшит, и барабаны
 * об этом даже не узнают.
 */
export function createSymbolTextures(renderer: Renderer): Record<NeonSymbolId, Texture> {
  const textures = {} as Record<NeonSymbolId, Texture>

  for (const id of SYMBOL_IDS) {
    const drawing = drawSymbol(SYMBOLS[id])
    textures[id] = renderer.generateTexture({
      target: drawing,
      resolution: TEXTURE_RESOLUTION,
      antialias: true,
    })
    drawing.destroy({ children: true })
  }

  return textures
}

function drawSymbol(info: SymbolInfo): Container {
  const size = GRID.cellSize
  const drawing = new Container()

  const plate = new Graphics()
  plate
    .roundRect(0, 0, size, size, 18)
    .fill({ color: THEME.surface })
    .stroke({ width: 3, color: info.color, alpha: 0.75 })
  plate.roundRect(6, 6, size - 12, size - 12, 13).fill({ color: info.color, alpha: 0.14 })

  drawing.addChild(plate, info.emblem === 'text' ? drawLabel(info, size) : drawShape(info, size))
  return drawing
}

function drawLabel(info: SymbolInfo, size: number): Text {
  // Короткая подпись может быть крупной, длинная должна влезть в клетку.
  const scale = info.label.length > 2 ? 0.2 : 0.46

  const label = new Text({
    text: info.label,
    style: {
      fontFamily: FONT_FAMILY,
      fontSize: Math.round(size * scale),
      fontWeight: '700',
      fill: info.color,
    },
  })

  label.anchor.set(0.5)
  label.position.set(size / 2, size / 2)
  return label
}

function drawShape(info: SymbolInfo, size: number): Graphics {
  const shape = new Graphics()
  const center = size / 2
  const radius = size * 0.28

  if (info.emblem === 'circle') {
    shape.circle(center, center, radius)
  } else if (info.emblem === 'triangle') {
    shape.poly([
      center,
      center - radius,
      center + radius * 0.92,
      center + radius * 0.72,
      center - radius * 0.92,
      center + radius * 0.72,
    ])
  } else {
    shape.poly(starPoints(center, radius))
  }

  return shape.fill({ color: info.color, alpha: 0.95 })
}

/** Четырёхлучевая звезда: длинные луч и короткий через один. */
function starPoints(center: number, radius: number): number[] {
  const points: number[] = []
  const inner = radius * 0.4

  for (let step = 0; step < 8; step += 1) {
    const angle = (step * Math.PI) / 4 - Math.PI / 2
    const length = step % 2 === 0 ? radius : inner
    points.push(center + Math.cos(angle) * length, center + Math.sin(angle) * length)
  }

  return points
}

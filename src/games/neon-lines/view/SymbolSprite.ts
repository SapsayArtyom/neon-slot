import { Sprite, type Texture } from 'pixi.js'
import type { SymbolId } from '@sdk'
import { GRID } from '../config/grid'
import type { NeonSymbolId } from '../config/symbols'

/**
 * Символ на барабане. Смена символа — это подмена текстуры,
 * поэтому прокрутка не создаёт новых объектов.
 */
export class SymbolSprite extends Sprite {
  private readonly textures: Record<NeonSymbolId, Texture>

  constructor(textures: Record<NeonSymbolId, Texture>) {
    super(textures.ten)
    this.textures = textures
    this.setSize(GRID.cellSize, GRID.cellSize)
  }

  setSymbol(symbol: SymbolId): void {
    this.texture = this.textures[symbol as NeonSymbolId] ?? this.textures.ten
  }
}

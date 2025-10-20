import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color3 } from '@babylonjs/core/Maths/math.color'

import tilesetData from '../../data/overworldTileset.json'

type TileCategoryId = (typeof tilesetData.categories)[number]['id']

type EdgeDefinition = Partial<Record<EdgeKey | 'default', string>>

type RawTilesetTile = { column: number; row: number; weight?: number; edges?: EdgeDefinition }

type RawTilesetCategory = { id: string; tiles: RawTilesetTile[]; tags?: string[] }

type EdgeKey = 'north' | 'south' | 'east' | 'west'

export type TileType = TileCategoryId

export interface GeneratedTile {
  id: string
  column: number
  row: number
  position: Vector3
  type: TileType
  tags: string[]
  edges: Record<EdgeKey, string>
}

export interface GeneratedWorld {
  tiles: GeneratedTile[]
  tileSize: number
  width: number
  depth: number
  spawnTile: GeneratedTile
  root: TransformNode
}

const TILESET_URL = tilesetData.texture
const TILESET_COLUMNS = tilesetData.columns
const TILESET_ROWS = tilesetData.rows

interface WeightedTile {
  categoryId: TileCategoryId
  column: number
  row: number
  weight: number
  tags: string[]
  edges: Record<EdgeKey, string>
}

/**
 * Generates a lightweight procedurally colored tile world for exploration prototypes.
 */
export class ProceduralWorldGenerator {
  private readonly tileSize: number
  private readonly columns: number
  private readonly rows: number
  private readonly materialCache = new Map<string, StandardMaterial>()
  private sharedTexture: Texture | null = null
  private readonly allTiles: WeightedTile[] = []
  private readonly grassTiles: WeightedTile[]
  private readonly defaultGrassTile: WeightedTile

  public constructor({ tileSize = 2, columns = 20, rows = 20 }: { tileSize?: number; columns?: number; rows?: number } = {}) {
    this.tileSize = tileSize
    this.columns = columns
    this.rows = rows
    this.initializeTileset()
    this.grassTiles = this.allTiles.filter((tile) => tile.tags.includes('grass'))
    if (this.grassTiles.length === 0) {
      throw new Error('Tileset must define at least one grass tile')
    }
    this.defaultGrassTile = this.resolveDefaultGrassTile()
  }

  /**
   * Creates meshes representing a random tile world and returns relevant metadata.
   */
  public generate(scene: Scene): GeneratedWorld {
    const tiles: GeneratedTile[] = []
    const tileSpacing = this.tileSize
    const offsetX = -(this.columns * tileSpacing) / 2 + tileSpacing / 2
    const offsetZ = -(this.rows * tileSpacing) / 2 + tileSpacing / 2

    const worldRoot = new TransformNode('world-root', scene)

    for (let row = 0; row < this.rows; row += 1) {
      for (let column = 0; column < this.columns; column += 1) {
        const variant = this.defaultGrassTile
        const position = new Vector3(offsetX + column * tileSpacing, 0, offsetZ + row * tileSpacing)
        const tileId = `tile-${column}-${row}`

        const tile = MeshBuilder.CreateGround(tileId, { width: tileSpacing, height: tileSpacing }, scene)
        tile.parent = worldRoot
        tile.position.copyFrom(position)
        tile.material = this.getMaterialForVariant(scene, variant)
        tile.receiveShadows = true

        tiles.push({ id: tileId, column, row, position, type: variant.categoryId, tags: variant.tags, edges: variant.edges })
      }
    }

    const spawnTile = this.pickSpawnTile(tiles)
    worldRoot.metadata = { tileSize: this.tileSize, columns: this.columns, rows: this.rows }

    return {
      tiles,
      tileSize: this.tileSize,
      width: this.columns,
      depth: this.rows,
      spawnTile,
      root: worldRoot,
    }
  }

  private pickSpawnTile(tiles: GeneratedTile[]): GeneratedTile {
    const centerIndex = Math.floor(tiles.length / 2)
    return tiles[centerIndex]
  }

  private initializeTileset(): void {
    const categories = tilesetData.categories as RawTilesetCategory[]
    for (const category of categories) {
      const pool: WeightedTile[] = []
      const tags = category.tags ?? []
      const defaultEdgeType = this.inferDefaultEdgeType(tags)
      for (const tile of category.tiles) {
        const weight = tile.weight ?? 1
        const edges = this.normalizeEdges(tile.edges, defaultEdgeType)
        const weightedTile: WeightedTile = { categoryId: category.id, column: tile.column, row: tile.row, weight, tags, edges }
        pool.push(weightedTile)
        this.allTiles.push(weightedTile)
      }
      if (pool.length > 0) {
        // retain for potential future biome-specific selection
      }
    }
  }

  private getMaterialForVariant(scene: Scene, variant: WeightedTile): StandardMaterial {
    const key = `${variant.column}-${variant.row}`
    const existing = this.materialCache.get(key)
    if (existing) {
      return existing
    }

    const material = new StandardMaterial(`mat-ground-${key}`, scene)
    material.specularColor = Color3.Black()
    material.backFaceCulling = false

    const texture = this.getSharedTexture(scene)
    const tileTexture = texture.clone()
    tileTexture.uScale = 1 / TILESET_COLUMNS
    tileTexture.vScale = 1 / TILESET_ROWS
    tileTexture.uOffset = variant.column / TILESET_COLUMNS
    tileTexture.vOffset = variant.row / TILESET_ROWS

    material.diffuseTexture = tileTexture

    this.materialCache.set(key, material)
    return material
  }

  private getSharedTexture(scene: Scene): Texture {
    if (!this.sharedTexture) {
      this.sharedTexture = new Texture(TILESET_URL, scene, false, false, Texture.NEAREST_SAMPLINGMODE)
      this.sharedTexture.hasAlpha = true
    }

    return this.sharedTexture
  }

  private resolveDefaultGrassTile(): WeightedTile {
    const centerTiles = this.grassTiles.filter((tile) =>
      tile.edges.north === 'grass' && tile.edges.south === 'grass' && tile.edges.east === 'grass' && tile.edges.west === 'grass',
    )
    return centerTiles[0] ?? this.grassTiles[0]
  }

  private inferDefaultEdgeType(tags: string[]): string {
    if (tags.includes('grass')) {
      return 'grass'
    }
    if (tags.includes('path')) {
      return 'path'
    }
    if (tags.includes('water')) {
      return 'water'
    }
    return 'void'
  }

  private normalizeEdges(edges: EdgeDefinition | undefined, defaultEdgeType: string): Record<EdgeKey, string> {
    const fallback = edges?.default ?? defaultEdgeType
    const north = edges?.north ?? fallback
    const south = edges?.south ?? fallback
    const east = edges?.east ?? fallback
    const west = edges?.west ?? fallback

    return { north, south, east, west }
  }
}

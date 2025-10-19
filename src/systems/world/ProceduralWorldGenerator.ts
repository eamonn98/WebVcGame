import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'

export type TileType = 'grass' | 'sand' | 'water'

export interface GeneratedTile {
  id: string
  column: number
  row: number
  position: Vector3
  type: TileType
}

export interface GeneratedWorld {
  tiles: GeneratedTile[]
  tileSize: number
  width: number
  depth: number
  spawnTile: GeneratedTile
  root: TransformNode
}

interface MaterialPalette {
  grass: StandardMaterial
  sand: StandardMaterial
  water: StandardMaterial
}

/**
 * Generates a lightweight procedurally colored tile world for exploration prototypes.
 */
export class ProceduralWorldGenerator {
  private readonly tileSize: number
  private readonly columns: number
  private readonly rows: number

  public constructor({ tileSize = 2, columns = 20, rows = 20 }: { tileSize?: number; columns?: number; rows?: number } = {}) {
    this.tileSize = tileSize
    this.columns = columns
    this.rows = rows
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
    const baseTile = MeshBuilder.CreateGround('world-tile', { width: tileSpacing, height: tileSpacing }, scene)
    baseTile.isVisible = false

    const palette = this.createMaterialPalette(scene)

    for (let row = 0; row < this.rows; row += 1) {
      for (let column = 0; column < this.columns; column += 1) {
        const noise = Math.random()
        const type = this.resolveTileType(noise)
        const position = new Vector3(offsetX + column * tileSpacing, 0, offsetZ + row * tileSpacing)
        const tileId = `tile-${column}-${row}`

        const instance = baseTile.createInstance(tileId)
        instance.parent = worldRoot
        instance.position = position.clone()
        instance.material = palette[type]

        tiles.push({ id: tileId, column, row, position, type })
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

  private resolveTileType(noise: number): TileType {
    if (noise < 0.1) {
      return 'water'
    }

    if (noise < 0.25) {
      return 'sand'
    }

    return 'grass'
  }

  private createMaterialPalette(scene: Scene): MaterialPalette {
    const grass = new StandardMaterial('mat-grass', scene)
    grass.diffuseColor = new Color3(0.13, 0.35, 0.18)

    const sand = new StandardMaterial('mat-sand', scene)
    sand.diffuseColor = new Color3(0.76, 0.69, 0.57)

    const water = new StandardMaterial('mat-water', scene)
    water.diffuseColor = new Color3(0.19, 0.35, 0.58)

    return { grass, sand, water }
  }

  private pickSpawnTile(tiles: GeneratedTile[]): GeneratedTile {
    const centerIndex = Math.floor(tiles.length / 2)
    return tiles[centerIndex]
  }
}

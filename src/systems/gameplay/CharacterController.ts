import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { SpriteManager } from '@babylonjs/core/Sprites/spriteManager'
import { Sprite } from '@babylonjs/core/Sprites/sprite'
import '@babylonjs/core/Sprites/spriteSceneComponent'
import type { Scene } from '@babylonjs/core/scene'

import type { InputManager } from '../../input/InputManager.ts'
import type { GeneratedWorld } from '../world/ProceduralWorldGenerator.ts'

/**
 * Drives player avatar movement using abstracted input actions.
 */
export class CharacterController {
  private readonly input: InputManager
  private readonly world: GeneratedWorld
  private readonly movementSpeed = 4
  private readonly anchor: TransformNode
  private readonly spriteManager: SpriteManager
  private readonly sprite: Sprite
  private readonly shadowCaster: AbstractMesh
  private readonly moveDirection = new Vector3()
  private readonly velocity = new Vector3()
  private currentDirection: 'south' | 'north' | 'east' | 'west' = 'south'
  private animationFrameAccumulator = 0
  private currentFrameIndex = 1
  private animationDirection = 1

  private static readonly FRAME_COLUMNS_PER_CHARACTER = 3
  private static readonly FRAME_ROWS_PER_CHARACTER = 4
  private static readonly SHEET_COLUMNS = 12
  private static readonly CHARACTERS_PER_ROW = CharacterController.SHEET_COLUMNS / CharacterController.FRAME_COLUMNS_PER_CHARACTER
  private static readonly SELECTED_CHARACTER_INDEX = 0
  private static readonly IDLE_FRAME_COLUMN = 1
  private static readonly ANIMATION_CONFIG: Record<
    'south' | 'north' | 'east' | 'west',
    { row: number; frameCount: number; frameOffset: number; loopDelay: number }
  > = {
    south: { row: 0, frameCount: 3, frameOffset: 0, loopDelay: 90 },
    west: { row: 1, frameCount: 3, frameOffset: 0, loopDelay: 90 },
    east: { row: 2, frameCount: 3, frameOffset: 0, loopDelay: 90 },
    north: { row: 3, frameCount: 3, frameOffset: 0, loopDelay: 90 },
  }

  public constructor(scene: Scene, input: InputManager, world: GeneratedWorld) {
    this.input = input
    this.world = world

    this.anchor = new TransformNode('player-anchor', scene)
    this.anchor.parent = world.root
    this.anchor.position = this.world.spawnTile.position.clone().add(new Vector3(0, 1, 0))

    this.spriteManager = new SpriteManager('playerSprites', '/assets/spritesheets/mvc-sprites.png', 1, { width: 48, height: 48 }, scene)
    this.sprite = new Sprite('playerSprite', this.spriteManager)
    this.sprite.size = 1.6
    this.sprite.position.copyFrom(this.anchor.position)
    this.sprite.cellIndex = CharacterController.frameIndexForRow(
      CharacterController.ANIMATION_CONFIG.south.row,
      CharacterController.ANIMATION_CONFIG.south.frameOffset + CharacterController.IDLE_FRAME_COLUMN,
    )
    this.currentFrameIndex = CharacterController.IDLE_FRAME_COLUMN
    this.animationDirection = 1

    this.shadowCaster = MeshBuilder.CreateSphere('player-shadow-caster', { diameter: 1.1, segments: 12 }, scene)
    this.shadowCaster.parent = this.anchor
    this.shadowCaster.position.set(0, 0.5, 0)
    this.shadowCaster.isPickable = false
    const shadowMaterial = new StandardMaterial('player-shadow-caster-mat', scene)
    shadowMaterial.diffuseColor = Color3.White()
    shadowMaterial.specularColor = Color3.Black()
    shadowMaterial.alpha = 0.02
    shadowMaterial.disableLighting = true
    this.shadowCaster.material = shadowMaterial
  }

  /**
   * Updates the avatar position according to current input state.
   */
  public update(deltaTime: number): void {
    const axis = this.input.getMovementAxis()
    this.computeMovementDirection(axis.x, axis.y)
    if (this.moveDirection.lengthSquared() === 0) {
      this.velocity.set(0, 0, 0)
      this.updateFacing(false, deltaTime)
      return
    }

    this.moveDirection.normalize()
    const displacement = this.moveDirection.scale(this.movementSpeed * deltaTime)
    const nextPosition = this.anchor.position.add(displacement)

    this.anchor.position = this.clampWithinWorld(nextPosition)
    this.sprite.position.copyFrom(this.anchor.position)
    this.velocity.copyFrom(this.moveDirection)
    this.velocity.scaleInPlace(this.movementSpeed)
    this.updateFacing(true, deltaTime)
  }

  /**
   * World-space position accessor for camera tracking.
   */
  public getPosition(): Vector3 {
    return this.anchor.position.clone()
  }

  public getVelocity(): Vector3 {
    return this.velocity.clone()
  }

  public getShadowCaster(): AbstractMesh {
    return this.shadowCaster
  }

  public getMovementSpeed(): number {
    return this.movementSpeed
  }

  /**
   * Releases the underlying Babylon mesh resources.
   */
  public dispose(): void {
    this.sprite.dispose()
    this.spriteManager.dispose()
    this.shadowCaster.dispose()
    this.anchor.dispose()
  }

  private clampWithinWorld(position: Vector3): Vector3 {
    const halfWidth = (this.world.width * this.world.tileSize) / 2 - this.world.tileSize * 0.25
    const halfDepth = (this.world.depth * this.world.tileSize) / 2 - this.world.tileSize * 0.25

    return new Vector3(
      Math.max(-halfWidth, Math.min(halfWidth, position.x)),
      position.y,
      Math.max(-halfDepth, Math.min(halfDepth, position.z)),
    )
  }

  private computeMovementDirection(axisX: number, axisY: number): void {
    if (Math.abs(axisX) < 0.0001 && Math.abs(axisY) < 0.0001) {
      this.moveDirection.set(0, 0, 0)
      return
    }

    this.moveDirection.set(axisX, 0, -axisY)
  }

  private updateFacing(isMoving: boolean, deltaTime: number): void {
    const configMap = CharacterController.ANIMATION_CONFIG

    if (!isMoving) {
      const idleConfig = configMap[this.currentDirection]
      this.currentFrameIndex = CharacterController.IDLE_FRAME_COLUMN
      this.animationDirection = 1
      this.sprite.cellIndex = CharacterController.frameIndexForRow(idleConfig.row, idleConfig.frameOffset + this.currentFrameIndex)
      this.animationFrameAccumulator = 0
      return
    }

    const absX = Math.abs(this.moveDirection.x)
    const absZ = Math.abs(this.moveDirection.z)

    let direction: 'south' | 'north' | 'east' | 'west'
    if (absZ >= absX) {
      if (this.moveDirection.z < -0.001) {
        direction = 'south'
      } else if (this.moveDirection.z > 0.001) {
        direction = 'north'
      } else {
        direction = this.currentDirection
      }
    } else {
      direction = this.moveDirection.x >= 0 ? 'east' : 'west'
    }

    const config = configMap[direction]

    if (this.currentDirection !== direction) {
      this.currentDirection = direction
      this.currentFrameIndex = CharacterController.IDLE_FRAME_COLUMN
      this.animationDirection = 1
      this.animationFrameAccumulator = 0
    }

    this.animationFrameAccumulator += deltaTime * 1000
    if (this.animationFrameAccumulator >= config.loopDelay) {
      this.animationFrameAccumulator %= config.loopDelay
      this.advanceAnimationFrame(config)
    }

    const column = config.frameOffset + this.currentFrameIndex
    this.sprite.cellIndex = CharacterController.frameIndexForRow(config.row, column)
  }

  private advanceAnimationFrame(config: { frameCount: number }): void {
    this.currentFrameIndex += this.animationDirection

    if (this.currentFrameIndex >= config.frameCount) {
      this.currentFrameIndex = config.frameCount - 2
      this.animationDirection = -1
    } else if (this.currentFrameIndex < 0) {
      this.currentFrameIndex = 1
      this.animationDirection = 1
    } else if (this.currentFrameIndex === config.frameCount - 1) {
      this.animationDirection = -1
    } else if (this.currentFrameIndex === 0) {
      this.animationDirection = 1
    }
  }

  private static frameIndexForRow(row: number, column = 0): number {
    const baseRow = Math.floor(CharacterController.SELECTED_CHARACTER_INDEX / CharacterController.CHARACTERS_PER_ROW)
    const baseColumn = CharacterController.SELECTED_CHARACTER_INDEX % CharacterController.CHARACTERS_PER_ROW

    const sheetRow = baseRow * CharacterController.FRAME_ROWS_PER_CHARACTER + row
    const sheetColumn = baseColumn * CharacterController.FRAME_COLUMNS_PER_CHARACTER + column

    return sheetRow * CharacterController.SHEET_COLUMNS + sheetColumn
  }
}

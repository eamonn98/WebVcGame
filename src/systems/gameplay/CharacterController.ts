import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { Scene } from '@babylonjs/core/scene'
import type { Mesh } from '@babylonjs/core/Meshes/mesh'

import type { InputManager } from '../../input/InputManager.ts'
import type { GeneratedWorld } from '../world/ProceduralWorldGenerator.ts'

/**
 * Drives player avatar movement using abstracted input actions.
 */
export class CharacterController {
  private readonly input: InputManager
  private readonly world: GeneratedWorld
  private readonly movementSpeed = 6
  private readonly mesh: Mesh

  public constructor(scene: Scene, input: InputManager, world: GeneratedWorld) {
    this.input = input
    this.world = world

    this.mesh = MeshBuilder.CreateCapsule('player-avatar', { height: 1.8, radius: 0.5 }, scene)
    this.mesh.parent = world.root
    this.mesh.position = this.world.spawnTile.position.clone().add(new Vector3(0, 1, 0))
  }

  /**
   * Updates the avatar position according to current input state.
   */
  public update(deltaTime: number): void {
    const axis = this.input.getMovementAxis()
    if (axis.x === 0 && axis.y === 0) {
      return
    }

    const displacement = new Vector3(axis.x, 0, axis.y)
    displacement.scaleInPlace(this.movementSpeed * deltaTime)
    const nextPosition = this.mesh.position.add(displacement)

    this.mesh.position = this.clampWithinWorld(nextPosition)
  }

  /**
   * World-space position accessor for camera tracking.
   */
  public getPosition(): Vector3 {
    return this.mesh.position.clone()
  }

  /**
   * Releases the underlying Babylon mesh resources.
   */
  public dispose(): void {
    this.mesh.dispose()
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
}

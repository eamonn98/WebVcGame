import type { Scene } from '@babylonjs/core/scene'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'
import { Color4 } from '@babylonjs/core/Maths/math.color'

import type { GameEvent } from '../../core/events/GameEvent.ts'
import type { EventBus } from '../../core/events/EventBus.ts'
import { BaseScene } from '../BaseScene.ts'
import { ServiceLocator } from '../../core/ServiceLocator.ts'
import type { WorldManager } from '../../systems/world/WorldManager.ts'
import type { GeneratedWorld } from '../../systems/world/ProceduralWorldGenerator.ts'
import type { InputManager } from '../../input/InputManager.ts'
import { CharacterController } from '../../systems/gameplay/CharacterController.ts'

/**
 * Main exploration scene where the player navigates the overworld biome.
 */
export class OverworldScene extends BaseScene {
  private camera: UniversalCamera | null = null
  private worldManager: WorldManager | null = null
  private world: GeneratedWorld | null = null
  private inputManager: InputManager | null = null
  private characterController: CharacterController | null = null
  private readonly cameraOffset = new Vector3(0, 8, -12)

  public constructor(scene: Scene, events: EventBus<GameEvent>) {
    super(scene, events)
  }

  /** @inheritdoc */
  public async preload(): Promise<void> {
    // Reserve for asset preloading.
  }

  /** @inheritdoc */
  public async create(): Promise<void> {
    const canvas = this.scene.getEngine().getRenderingCanvas()
    this.camera = new UniversalCamera('overworldCamera', new Vector3(0, 8, -12), this.scene)
    if (canvas) {
      this.camera.attachControl(canvas, true)
    }

    this.worldManager = ServiceLocator.resolve<WorldManager>('worldManager')
    this.world = this.worldManager.build(this.scene)

    this.inputManager = ServiceLocator.resolve<InputManager>('inputManager')
    this.characterController = new CharacterController(this.scene, this.inputManager, this.world)

    this.camera.position = this.characterController.getPosition().add(this.cameraOffset)
    this.camera.setTarget(this.characterController.getPosition())

    this.events.publish({ type: 'world:changeRegion', payload: 'glade-entry' })
  }

  /** @inheritdoc */
  public update(deltaTime: number): void {
    this.worldManager?.update(deltaTime)
    this.characterController?.update(deltaTime)
    this.updateCamera()
  }

  /** @inheritdoc */
  public onEvent(event: GameEvent): void {
    if (event.type === 'world:regionLoaded' && event.payload) {
      const payload = event.payload as { biome?: { ambientColor: [number, number, number] } }
      if (payload?.biome?.ambientColor) {
        const [r, g, b] = payload.biome.ambientColor
        this.scene.clearColor = new Color4(r * 0.2, g * 0.2, b * 0.2, 1)
      }
    }
  }

  /** @inheritdoc */
  public async dispose(): Promise<void> {
    this.camera?.dispose()
    this.camera = null
    this.characterController?.dispose()
    this.characterController = null
    this.worldManager?.clearGeneratedWorld()
    this.world = null
  }

  private updateCamera(): void {
    if (!this.camera || !this.characterController) {
      return
    }

    const targetPosition = this.characterController.getPosition()
    const desiredPosition = targetPosition.add(this.cameraOffset)
    this.camera.position = Vector3.Lerp(this.camera.position, desiredPosition, 0.1)
    this.camera.setTarget(Vector3.Lerp(this.camera.getTarget(), targetPosition, 0.2))
  }
}

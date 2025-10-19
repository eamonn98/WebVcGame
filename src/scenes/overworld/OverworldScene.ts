import type { Scene } from '@babylonjs/core/scene'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'

import type { GameEvent } from '../../core/events/GameEvent.ts'
import type { EventBus } from '../../core/events/EventBus.ts'
import { BaseScene } from '../BaseScene.ts'
import { ServiceLocator } from '../../core/ServiceLocator.ts'
import type { WorldManager } from '../../systems/world/WorldManager.ts'

/**
 * Main exploration scene where the player navigates the overworld biome.
 */
export class OverworldScene extends BaseScene {
  private camera: UniversalCamera | null = null
  private worldManager: WorldManager | null = null

  public constructor(scene: Scene, events: EventBus<GameEvent>) {
    super(scene, events)
  }

  /** @inheritdoc */
  public async preload(): Promise<void> {
    // Reserve for asset preloading.
  }

  /** @inheritdoc */
  public async create(): Promise<void> {
    this.camera = new UniversalCamera('overworldCamera', new Vector3(0, 5, -10), this.scene)
    this.camera.setTarget(Vector3.Zero())
    this.camera.attachControl(true)

    this.worldManager = ServiceLocator.resolve<WorldManager>('worldManager')
    this.events.publish({ type: 'world:changeRegion', payload: 'glade-entry' })
  }

  /** @inheritdoc */
  public update(deltaTime: number): void {
    this.worldManager?.update(deltaTime)
  }

  /** @inheritdoc */
  public onEvent(event: GameEvent): void {
    if (event.type === 'world:regionLoaded') {
      // TODO: Update environment based on region payload.
    }
  }

  /** @inheritdoc */
  public async dispose(): Promise<void> {
    this.camera?.dispose()
    this.camera = null
  }
}

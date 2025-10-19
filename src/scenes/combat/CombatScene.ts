import type { Scene } from '@babylonjs/core/scene'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera'

import type { GameEvent } from '../../core/events/GameEvent.ts'
import type { EventBus } from '../../core/events/EventBus.ts'
import { BaseScene } from '../BaseScene.ts'

/**
 * Prototype combat encounter scene featuring turn-based interactions.
 */
export class CombatScene extends BaseScene {
  private camera: FreeCamera | null = null

  public constructor(scene: Scene, events: EventBus<GameEvent>) {
    super(scene, events)
  }

  /** @inheritdoc */
  public async preload(): Promise<void> {
    // TODO: Load combat shaders, characters, and UI assets.
  }

  /** @inheritdoc */
  public async create(): Promise<void> {
    this.camera = new FreeCamera('combatCamera', new Vector3(0, 10, -12), this.scene)
    this.camera.setTarget(Vector3.Zero())
    this.camera.attachControl(true)
  }

  /** @inheritdoc */
  public update(_deltaTime: number): void {
    // TODO: Update combat state machine.
  }

  /** @inheritdoc */
  public onEvent(event: GameEvent): void {
    if (event.type === 'combat:end') {
      this.events.publish({ type: 'scene:requestTransition', payload: 'overworld' })
    }
  }

  /** @inheritdoc */
  public async dispose(): Promise<void> {
    this.camera?.dispose()
    this.camera = null
  }
}

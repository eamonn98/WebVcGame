import type { Scene } from '@babylonjs/core/scene'
import { Color4 } from '@babylonjs/core/Maths/math.color'

import type { GameEvent } from '../../core/events/GameEvent.ts'
import type { EventBus } from '../../core/events/EventBus.ts'
import { BaseScene } from '../BaseScene.ts'

/**
 * Displays a loading indicator while assets are being prepared.
 */
export class LoadingScene extends BaseScene {
  public constructor(scene: Scene, events: EventBus<GameEvent>) {
    super(scene, events)
  }

  /** @inheritdoc */
  public async preload(): Promise<void> {
    // Intentionally left blank - minimal placeholder assets.
  }

  /** @inheritdoc */
  public async create(): Promise<void> {
    this.scene.clearColor = new Color4(0.05, 0.05, 0.1, 1)
    // TODO: Add loading overlay UI when HUD system is ready.
  }

  /** @inheritdoc */
  public update(_deltaTime: number): void {
    // Reserved for spinner animations or progress checks.
  }

  /** @inheritdoc */
  public onEvent(event: GameEvent): void {
    if (event.type === 'loading:complete') {
      this.events.publish({ type: 'scene:requestTransition', payload: 'title' })
    }
  }

  /** @inheritdoc */
  public async dispose(): Promise<void> {
    // Nothing to dispose yet.
  }
}

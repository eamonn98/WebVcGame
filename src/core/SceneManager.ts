import type { Scene } from '@babylonjs/core/scene'

import type { GameEvent } from './events/GameEvent.ts'
import type { EventBus } from './events/EventBus.ts'
import { SceneRegistry } from '../scenes/SceneRegistry.ts'
import type { SceneKey } from '../scenes/SceneTypes.ts'
import { ServiceLocator } from './ServiceLocator.ts'
import type { BaseScene } from '../scenes/BaseScene.ts'
import type { AppConfiguration } from '../config/AppConfig.ts'

/**
 * Handles scene lifecycle transitions and updates.
 */
export class SceneManager {
  private readonly scene: Scene
  private readonly events: EventBus<GameEvent>
  private activeSceneKey: SceneKey | null = null
  private activeScene: BaseScene | null = null

  public constructor(scene: Scene, events: EventBus<GameEvent>) {
    this.scene = scene
    this.events = events

    this.events.subscribe('scene:requestTransition', (event) => {
      const next = event.payload as SceneKey | undefined
      if (next) {
        void this.transitionTo(next)
      }
    })
  }

  /**
   * Loads the initial scene defined by the scene registry.
   */
  public async loadInitialScene(): Promise<void> {
    const config = ServiceLocator.resolve<AppConfiguration>('config')
    const targetKey = (config.initialScene as SceneKey) ?? 'title'
    await this.transitionTo(targetKey)
  }

  /**
   * Moves to the provided scene key, disposing the current one if necessary.
   */
  public async transitionTo(target: SceneKey): Promise<void> {
    if (this.activeSceneKey === target) {
      return
    }

    if (this.activeScene) {
      await this.activeScene.dispose()
      this.events.publish({ type: 'scene:disposed', payload: this.activeSceneKey })
      this.activeScene = null
    }

    const nextScene = SceneRegistry.create(target, this.scene, this.events)
    await nextScene.preload()
    await nextScene.create()

    this.activeScene = nextScene
    this.activeSceneKey = target
    this.events.publish({ type: 'scene:activated', payload: target })
  }

  /**
   * Steps the currently active scene.
   */
  public update(deltaTime: number): void {
    this.activeScene?.update(deltaTime)
  }

  /**
   * Broadcasts events to the active scene.
   */
  public emit(event: GameEvent): void {
    this.activeScene?.onEvent(event)
  }

  /**
   * Tears down the active scene and clears state.
   */
  public async dispose(): Promise<void> {
    if (!this.activeScene) {
      return
    }

    await this.activeScene.dispose()
    this.activeScene = null
    this.activeSceneKey = null
  }
}

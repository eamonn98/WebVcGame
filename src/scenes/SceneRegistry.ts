import type { Scene } from '@babylonjs/core/scene'

import type { EventBus } from '../core/events/EventBus.ts'
import type { GameEvent } from '../core/events/GameEvent.ts'
import type { BaseScene } from './BaseScene.ts'
import { TitleScene } from './TitleScene.ts'
import { OverworldScene } from './overworld/OverworldScene.ts'
import { CombatScene } from './combat/CombatScene.ts'
import { LoadingScene } from './utility/LoadingScene.ts'
import type { SceneKey } from './SceneTypes.ts'

/**
 * Factory for constructing scene instances by key.
 */
export class SceneRegistry {
  /**
   * Instantiates a scene based on a key string.
   */
  public static create(key: SceneKey, scene: Scene, events: EventBus<GameEvent>): BaseScene {
    switch (key) {
      case 'loading':
        return new LoadingScene(scene, events)
      case 'title':
        return new TitleScene(scene, events)
      case 'overworld':
        return new OverworldScene(scene, events)
      case 'combat':
        return new CombatScene(scene, events)
      default:
        throw new Error(`Scene with key '${key}' is not registered.`)
    }
  }
}

import type { Scene } from '@babylonjs/core/scene'

import type { GameEvent } from '../core/events/GameEvent.ts'
import type { EventBus } from '../core/events/EventBus.ts'

/**
 * Shared contract for Babylon-powered game scenes.
 */
export abstract class BaseScene {
  protected readonly scene: Scene
  protected readonly events: EventBus<GameEvent>

  /**
   * Creates the scene wrapper with reference to the underlying Babylon scene.
   */
  protected constructor(scene: Scene, events: EventBus<GameEvent>) {
    this.scene = scene
    this.events = events
  }

  /**
   * Called once before the scene becomes active.
   */
  public abstract preload(): Promise<void>

  /**
   * Initializes scene content and registers runtime systems.
   */
  public abstract create(): Promise<void>

  /**
   * Performs per-frame updates for the scene.
   */
  public abstract update(deltaTime: number): void

  /**
   * Handles incoming domain events for the scene.
   */
  public abstract onEvent(event: GameEvent): void

  /**
   * Disposes scene-specific resources.
   */
  public abstract dispose(): Promise<void>
}

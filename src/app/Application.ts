import type { Engine } from '@babylonjs/core/Engines/engine'
import type { Scene } from '@babylonjs/core/scene'

import { ServiceLocator } from '../core/ServiceLocator.ts'
import { SceneManager } from '../core/SceneManager.ts'
import { EventBus } from '../core/events/EventBus.ts'
import type { GameEvent } from '../core/events/GameEvent.ts'
import { InputManager } from '../input/InputManager.ts'
import { AudioManager } from '../systems/audio/AudioManager.ts'
import { RenderingPipeline } from '../systems/rendering/RenderingPipeline.ts'
import { WorldManager } from '../systems/world/WorldManager.ts'
import { GameplayCoordinator } from '../systems/gameplay/GameplayCoordinator.ts'
import { HudManager } from '../systems/ui/HudManager.ts'
import { AppConfig } from '../config/AppConfig.ts'

/**
 * Coordinates application lifecycle and orchestrates high-level systems.
 */
export class Application {
  private readonly eventBus: EventBus<GameEvent>
  private readonly sceneManager: SceneManager
  private readonly inputManager: InputManager
  private readonly audioManager: AudioManager
  private readonly renderingPipeline: RenderingPipeline
  private readonly worldManager: WorldManager
  private readonly gameplayCoordinator: GameplayCoordinator
  private readonly hudManager: HudManager
  private isInitialized = false

  /**
   * Builds the application shell around the provided engine and scene.
   */
  public constructor(engine: Engine, scene: Scene) {
    ServiceLocator.register('config', AppConfig.defaults())
    ServiceLocator.register('engine', engine)
    ServiceLocator.register('scene', scene)

    this.eventBus = new EventBus<GameEvent>()
    ServiceLocator.register('events', this.eventBus)

    this.sceneManager = new SceneManager(scene, this.eventBus)
    this.inputManager = new InputManager(this.eventBus)
    this.audioManager = new AudioManager(this.eventBus)
    this.renderingPipeline = new RenderingPipeline(scene, this.eventBus)
    this.worldManager = new WorldManager(this.eventBus)
    this.gameplayCoordinator = new GameplayCoordinator(this.eventBus)
    this.hudManager = new HudManager(this.eventBus)

    ServiceLocator.register('worldManager', this.worldManager)
    ServiceLocator.register('audioManager', this.audioManager)
    ServiceLocator.register('inputManager', this.inputManager)
  }

  /**
   * Boots runtime systems, registers dependencies, and loads the initial scene.
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    await this.inputManager.initialize()
    await this.audioManager.initialize()
    await this.renderingPipeline.initialize()
    await this.worldManager.initialize()
    await this.gameplayCoordinator.initialize()
    await this.hudManager.initialize()

    await this.sceneManager.loadInitialScene()
    this.isInitialized = true
  }

  /**
   * Updates all systems for the current frame.
   */
  public update(deltaTime: number): void {
    if (!this.isInitialized) {
      return
    }

    this.inputManager.update(deltaTime)
    this.gameplayCoordinator.update(deltaTime)
    this.worldManager.update(deltaTime)
    this.audioManager.update(deltaTime)
    this.renderingPipeline.update(deltaTime)
    this.sceneManager.update(deltaTime)
    this.hudManager.update(deltaTime)
  }

  /**
   * Forwards a dispatched event to the global event bus.
   */
  public dispatch(event: GameEvent): void {
    this.eventBus.publish(event)
  }

  /**
   * Handles teardown of runtime systems.
   */
  public async dispose(): Promise<void> {
    if (!this.isInitialized) {
      return
    }

    await this.sceneManager.dispose()
    await this.renderingPipeline.dispose()
    await this.worldManager.dispose()
    await this.gameplayCoordinator.dispose()
    await this.audioManager.dispose()
    this.inputManager.dispose()
    await this.hudManager.dispose()

    ServiceLocator.reset()
    this.isInitialized = false
  }
}

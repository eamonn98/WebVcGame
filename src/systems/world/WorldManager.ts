import type { Scene } from '@babylonjs/core/scene'

import type { GameEvent } from '../../core/events/GameEvent.ts'
import type { EventBus } from '../../core/events/EventBus.ts'
import { WorldState } from '../../data/WorldState.ts'
import type { GeneratedWorld } from './ProceduralWorldGenerator.ts'
import { ProceduralWorldGenerator } from './ProceduralWorldGenerator.ts'

/**
 * Coordinates world streaming, biome transitions, and environmental effects.
 */
export class WorldManager {
  private readonly events: EventBus<GameEvent>
  private readonly worldState = new WorldState()
  private readonly generator = new ProceduralWorldGenerator()
  private generatedWorld: GeneratedWorld | null = null
  private changeRegionHandler: ((event: GameEvent) => void) | null = null

  public constructor(events: EventBus<GameEvent>) {
    this.events = events
  }

  /**
   * Seeds initial world data and event subscriptions.
   */
  public async initialize(): Promise<void> {
    this.worldState.seed(
      [
        { id: 'forest', name: 'Emerald Glade', ambientColor: [0.2, 0.4, 0.2], musicTrack: 'forest_theme' },
      ],
      [{ id: 'glade-entry', biome: 'forest', connections: [] }],
    )

    this.changeRegionHandler = (event) => {
      const regionId = event.payload as string | undefined
      if (regionId) {
        this.handleRegionChange(regionId)
      }
    }

    this.events.subscribe('world:changeRegion', this.changeRegionHandler)
  }

  /**
   * Allows per-frame world adjustments.
   */
  public update(_deltaTime: number): void {
    // Placeholder for environmental animations and streaming logic.
  }

  /**
   * Releases world-related resources.
   */
  public async dispose(): Promise<void> {
    this.clearGeneratedWorld()
    if (this.changeRegionHandler) {
      this.events.unsubscribe('world:changeRegion', this.changeRegionHandler)
      this.changeRegionHandler = null
    }
  }

  /**
   * Generates the procedural world into the provided scene.
   */
  public build(scene: Scene): GeneratedWorld {
    this.clearGeneratedWorld()
    this.generatedWorld = this.generator.generate(scene)
    return this.generatedWorld
  }

  /**
   * Current generated world data.
   */
  public getWorld(): GeneratedWorld | null {
    return this.generatedWorld
  }

  /**
   * Disposes the generated world without removing event subscriptions.
   */
  public clearGeneratedWorld(): void {
    if (this.generatedWorld) {
      this.generatedWorld.root.dispose()
      this.generatedWorld = null
    }
  }

  /**
   * Applies side effects when the active region changes.
   */
  private handleRegionChange(regionId: string): void {
    const region = this.worldState.getRegion(regionId)
    if (!region) {
      return
    }

    const biome = this.worldState.getBiome(region.biome)
    this.events.publish({ type: 'world:regionLoaded', payload: { region, biome } })
  }
}

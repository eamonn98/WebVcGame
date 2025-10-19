import type { GameEvent } from '../../core/events/GameEvent.ts'
import type { EventBus } from '../../core/events/EventBus.ts'
import { WorldState } from '../../data/WorldState.ts'

/**
 * Coordinates world streaming, biome transitions, and environmental effects.
 */
export class WorldManager {
  private readonly events: EventBus<GameEvent>
  private readonly worldState = new WorldState()

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

    this.events.subscribe('world:changeRegion', (event) => {
      const regionId = event.payload as string | undefined
      if (regionId) {
        this.handleRegionChange(regionId)
      }
    })
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
    // Nothing to dispose yet.
  }

  /**
   * Applies side effects when the active region changes.
   */
  private handleRegionChange(regionId: string): void {
    const region = this.worldState.getRegion(regionId)
    if (!region) {
      return
    }

    this.events.publish({ type: 'world:regionLoaded', payload: region })
  }
}

import type { GameEvent } from '../../core/events/GameEvent.ts'
import type { EventBus } from '../../core/events/EventBus.ts'

/**
 * Responsible for heads-up display overlays and UI widgets.
 */
export class HudManager {
  private readonly events: EventBus<GameEvent>

  public constructor(events: EventBus<GameEvent>) {
    this.events = events
  }

  /**
   * Initializes UI layers, hooking into resize events as required.
   */
  public async initialize(): Promise<void> {
    this.events.subscribe('hud:refresh', () => {
      // TODO: Trigger HUD refresh when gameplay state changes.
    })
  }

  /**
   * Updates HUD animations or status text.
   */
  public update(_deltaTime: number): void {
    // Placeholder for HUD updates.
  }

  /**
   * Disposes all UI resources.
   */
  public async dispose(): Promise<void> {
    // Placeholder for cleanup logic.
  }
}

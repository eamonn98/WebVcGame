import type { GameEvent } from '../../core/events/GameEvent.ts'
import type { EventBus } from '../../core/events/EventBus.ts'
import type { InputAction } from '../../input/InputBindings.ts'

/**
 * Coordinates gameplay state machines such as exploration and combat.
 */
export class GameplayCoordinator {
  private readonly events: EventBus<GameEvent>
  private currentState: 'idle' | 'exploration' | 'combat' = 'idle'

  public constructor(events: EventBus<GameEvent>) {
    this.events = events
  }

  /**
   * Hooks into event streams needed for gameplay.
   */
  public async initialize(): Promise<void> {
    this.events.subscribe('input:actionPressed', (event) => {
      const action = event.payload as InputAction | undefined
      if (action === 'action') {
        this.handleInteraction()
      }
    })

    this.events.subscribe('scene:activated', (event) => {
      if (event.payload === 'overworld') {
        this.currentState = 'exploration'
      }
      if (event.payload === 'combat') {
        this.currentState = 'combat'
      }
    })
  }

  /**
   * Updates gameplay subsystems for the active mode.
   */
  public update(_deltaTime: number): void {
    // Placeholder for state-specific logic (movement, AI, combat ticks).
  }

  /**
   * Tears down resources when unloading gameplay systems.
   */
  public async dispose(): Promise<void> {
    // Nothing to dispose yet.
  }

  private handleInteraction(): void {
    if (this.currentState === 'exploration') {
      this.events.publish({ type: 'world:interact', payload: null })
    }
  }
}

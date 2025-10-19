/**
 * Base interface for all events dispatched across the global event bus.
 */
export interface GameEvent {
  /**
   * Human readable event identifier.
   */
  type: string
  /**
   * Optional arbitrary payload for consumers.
   */
  payload?: unknown
}

/**
 * Helper type for strongly-typed event constructors.
 */
export type GameEventFactory<TPayload = unknown> = (payload: TPayload) => GameEvent

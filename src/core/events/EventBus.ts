export type EventHandler<TEvent> = (event: TEvent) => void

/**
 * Simple pub/sub event bus for decoupled communication between systems.
 */
export class EventBus<TEvent> {
  private readonly listeners = new Map<string, Set<EventHandler<TEvent>>>()
  private readonly anyListeners = new Set<EventHandler<TEvent>>()

  /**
   * Registers a listener for the specified event type.
   */
  public subscribe(eventType: string, handler: EventHandler<TEvent>): void {
    const handlers = this.listeners.get(eventType) ?? new Set<EventHandler<TEvent>>()
    handlers.add(handler)
    this.listeners.set(eventType, handlers)
  }

  /**
   * Registers a listener for all events.
   */
  public subscribeAll(handler: EventHandler<TEvent>): void {
    this.anyListeners.add(handler)
  }

  /**
   * Removes a previously registered listener.
   */
  public unsubscribe(eventType: string, handler: EventHandler<TEvent>): void {
    const handlers = this.listeners.get(eventType)
    if (!handlers) {
      return
    }

    handlers.delete(handler)
    if (handlers.size === 0) {
      this.listeners.delete(eventType)
    }
  }

  /**
   * Removes a previously registered any-listener.
   */
  public unsubscribeAll(handler: EventHandler<TEvent>): void {
    this.anyListeners.delete(handler)
  }

  /**
   * Publishes an event payload to all subscribers of its type.
   */
  public publish(event: TEvent & { type: string }): void {
    const handlers = this.listeners.get(event.type)
    if (handlers) {
      for (const handler of handlers) {
        handler(event)
      }
    }

    if (this.anyListeners.size > 0) {
      for (const handler of this.anyListeners) {
        handler(event)
      }
    }
  }

  /**
   * Clears all subscriptions.
   */
  public clear(): void {
    this.listeners.clear()
    this.anyListeners.clear()
  }

  /**
   * Removes all handlers for a given event type.
   */
  public clearType(eventType: string): void {
    this.listeners.delete(eventType)
  }
}

import { describe, expect, test } from "bun:test"
import { EventBus } from "../core/events/EventBus.ts"

describe("EventBus", () => {
  test("subscribe and publish by type", () => {
    const bus = new EventBus<{ type: string; payload?: unknown }>()
    let received: unknown = null
    bus.subscribe("ping", (e) => (received = e.payload))
    bus.publish({ type: "ping", payload: 42 })
    expect(received).toBe(42)
  })

  test("subscribeAll receives every event", () => {
    const bus = new EventBus<{ type: string; payload?: unknown }>()
    let count = 0
    bus.subscribeAll(() => count++)
    bus.publish({ type: "a" })
    bus.publish({ type: "b" })
    expect(count).toBe(2)
  })
})

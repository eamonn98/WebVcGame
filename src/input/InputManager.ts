import type { GameEvent } from '../core/events/GameEvent.ts'
import type { EventBus } from '../core/events/EventBus.ts'
import type { InputAction } from './InputBindings.ts'
import { DEFAULT_INPUT_BINDINGS } from './InputBindings.ts'

interface ActionState {
  held: boolean
  pressed: boolean
  released: boolean
}

/**
 * Centralizes keyboard, gamepad, and touch input, translating raw signals into abstract actions.
 */
export class InputManager {
  private readonly events: EventBus<GameEvent>
  private readonly bindings = DEFAULT_INPUT_BINDINGS
  private readonly actionStates = new Map<InputAction, ActionState>()
  private keyDownListener?: (event: KeyboardEvent) => void
  private keyUpListener?: (event: KeyboardEvent) => void

  public constructor(events: EventBus<GameEvent>) {
    this.events = events
  }

  /**
   * Configures event listeners and initializes action state storage.
   */
  public async initialize(): Promise<void> {
    for (const action of Object.keys(this.bindings) as InputAction[]) {
      this.actionStates.set(action, { held: false, pressed: false, released: false })
    }

    this.keyDownListener = (event) => this.handleKeyEvent(event, true)
    this.keyUpListener = (event) => this.handleKeyEvent(event, false)

    window.addEventListener('keydown', this.keyDownListener)
    window.addEventListener('keyup', this.keyUpListener)

    // TODO: Register gamepad/touch listeners once implementations are ready.
  }

  /**
   * Updates transient action states for the current frame.
   */
  public update(_deltaTime: number): void {
    for (const [action, state] of this.actionStates) {
      if (state.pressed) {
        this.events.publish({ type: 'input:actionPressed', payload: action })
      }

      state.pressed = false
      state.released = false
      this.actionStates.set(action, state)
    }
  }

  /**
   * Provides the current state for a specific action.
   */
  public getState(action: InputAction): ActionState | undefined {
    return this.actionStates.get(action)
  }

  /**
   * Unregisters listeners and clears action states.
   */
  public dispose(): void {
    if (this.keyDownListener) {
      window.removeEventListener('keydown', this.keyDownListener)
    }

    if (this.keyUpListener) {
      window.removeEventListener('keyup', this.keyUpListener)
    }

    this.actionStates.clear()
  }

  private handleKeyEvent(event: KeyboardEvent, isDown: boolean): void {
    const action = this.getActionForKey(event.code)
    if (!action) {
      return
    }

    const state = this.actionStates.get(action)
    if (!state) {
      return
    }

    if (isDown) {
      const wasHeld = state.held
      state.held = true
      state.pressed = !wasHeld
    } else {
      state.held = false
      state.released = true
    }

    this.actionStates.set(action, state)
  }

  /**
   * Returns the mapped action for the provided keyboard code, if any.
   */
  private getActionForKey(code: string): InputAction | null {
    return (Object.keys(this.bindings) as InputAction[]).find((action) =>
      this.bindings[action].keys.includes(code),
    ) ?? null
  }
}

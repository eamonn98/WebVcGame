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
  private movementAxis: { x: number; y: number } = { x: 0, y: 0 }
  private gamepadConnectedListener?: (event: GamepadEvent) => void
  private gamepadDisconnectedListener?: (event: GamepadEvent) => void
  private gamepadIndex: number | null = null
  private gamepadAxis: { x: number; y: number } = { x: 0, y: 0 }
  private readonly gamepadButtonBindings = new Map<number, InputAction[]>()
  private readonly previousGamepadButtons = new Map<number, boolean>()

  public constructor(events: EventBus<GameEvent>) {
    this.events = events
    this.buildGamepadButtonBindings()
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

    this.gamepadConnectedListener = (event) => {
      if (this.gamepadIndex === null) {
        this.gamepadIndex = event.gamepad.index
      }
    }

    this.gamepadDisconnectedListener = (event) => {
      if (this.gamepadIndex === event.gamepad.index) {
        this.gamepadIndex = null
        this.resetGamepadState()
      }
    }

    window.addEventListener('gamepadconnected', this.gamepadConnectedListener)
    window.addEventListener('gamepaddisconnected', this.gamepadDisconnectedListener)

    if (typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function') {
      const gamepads = navigator.getGamepads()
      for (const pad of gamepads) {
        if (pad) {
          this.gamepadIndex = pad.index
          break
        }
      }
    }
    this.recalculateMovementAxis()
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

    this.pollGamepad()
    this.recalculateMovementAxis()
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

    if (this.gamepadConnectedListener) {
      window.removeEventListener('gamepadconnected', this.gamepadConnectedListener)
    }

    if (this.gamepadDisconnectedListener) {
      window.removeEventListener('gamepaddisconnected', this.gamepadDisconnectedListener)
    }

    this.resetGamepadState()
    this.gamepadIndex = null
    this.actionStates.clear()
  }

  /**
   * Returns the normalized movement axis derived from the current input state.
   */
  public getMovementAxis(): { x: number; y: number } {
    return { ...this.movementAxis }
  }

  private handleKeyEvent(event: KeyboardEvent, isDown: boolean): void {
    const action = this.getActionForKey(event.code)
    if (!action) {
      return
    }

    this.updateActionState(action, isDown)
  }

  /**
   * Returns the mapped action for the provided keyboard code, if any.
   */
  private getActionForKey(code: string): InputAction | null {
    return (Object.keys(this.bindings) as InputAction[]).find((action) =>
      this.bindings[action].keys.includes(code),
    ) ?? null
  }

  private recalculateMovementAxis(): void {
    const up = this.actionStates.get('moveUp')?.held ? 1 : 0
    const down = this.actionStates.get('moveDown')?.held ? 1 : 0
    const left = this.actionStates.get('moveLeft')?.held ? 1 : 0
    const right = this.actionStates.get('moveRight')?.held ? 1 : 0

    let x = right - left
    let y = down - up

    x += this.gamepadAxis.x
    y += this.gamepadAxis.y

    const length = Math.hypot(x, y)
    if (length > 1) {
      x /= length
      y /= length
    }

    this.movementAxis = { x, y }
  }

  private buildGamepadButtonBindings(): void {
    for (const action of Object.keys(this.bindings) as InputAction[]) {
      for (const button of this.bindings[action].gamepadButtons) {
        const list = this.gamepadButtonBindings.get(button) ?? []
        list.push(action)
        this.gamepadButtonBindings.set(button, list)
      }
    }
  }

  private pollGamepad(): void {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') {
      this.gamepadAxis = { x: 0, y: 0 }
      return
    }

    const pads = navigator.getGamepads()
    let activePad: Gamepad | null = null

    if (this.gamepadIndex !== null) {
      activePad = pads[this.gamepadIndex] ?? null
    }

    if (!activePad) {
      for (const pad of pads) {
        if (pad) {
          activePad = pad
          this.gamepadIndex = pad.index
          break
        }
      }
    }

    if (!activePad) {
      this.resetGamepadState()
      this.gamepadAxis = { x: 0, y: 0 }
      return
    }

    const axisX = this.applyGamepadDeadzone(activePad.axes[0] ?? 0)
    const axisY = this.applyGamepadDeadzone(activePad.axes[1] ?? 0)
    this.gamepadAxis = this.normalizeAxis(axisX, axisY)

    for (const [buttonIndex, actions] of this.gamepadButtonBindings) {
      const pressed = Boolean(activePad.buttons[buttonIndex]?.pressed)
      const previous = this.previousGamepadButtons.get(buttonIndex) ?? false

      if (pressed !== previous) {
        for (const action of actions) {
          this.updateActionState(action, pressed)
        }
      }

      this.previousGamepadButtons.set(buttonIndex, pressed)
    }
  }

  private applyGamepadDeadzone(value: number): number {
    const deadzone = 0.2
    if (Math.abs(value) < deadzone) {
      return 0
    }

    const sign = Math.sign(value)
    const magnitude = (Math.abs(value) - deadzone) / (1 - deadzone)
    return sign * Math.min(1, magnitude)
  }

  private normalizeAxis(x: number, y: number): { x: number; y: number } {
    const length = Math.hypot(x, y)
    if (length === 0) {
      return { x: 0, y: 0 }
    }

    if (length > 1) {
      return { x: x / length, y: y / length }
    }

    return { x, y }
  }

  private updateActionState(action: InputAction, isDown: boolean): void {
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

  private resetGamepadState(): void {
    for (const [buttonIndex, wasPressed] of this.previousGamepadButtons) {
      if (!wasPressed) {
        continue
      }

      const actions = this.gamepadButtonBindings.get(buttonIndex)
      if (!actions) {
        continue
      }

      for (const action of actions) {
        this.updateActionState(action, false)
      }
    }

    this.previousGamepadButtons.clear()
    this.gamepadAxis = { x: 0, y: 0 }
  }
}

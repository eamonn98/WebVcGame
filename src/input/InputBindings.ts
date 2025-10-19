export type InputAction =
  | 'moveUp'
  | 'moveDown'
  | 'moveLeft'
  | 'moveRight'
  | 'action'
  | 'menu'
  | 'dash'
  | 'pause'

export interface InputBinding {
  keys: string[]
  gamepadButtons: number[]
  touchRegion?: string
}

/**
 * Default cross-platform input bindings.
 */
export const DEFAULT_INPUT_BINDINGS: Record<InputAction, InputBinding> = {
  moveUp: { keys: ['ArrowUp', 'KeyW'], gamepadButtons: [12], touchRegion: 'north' },
  moveDown: { keys: ['ArrowDown', 'KeyS'], gamepadButtons: [13], touchRegion: 'south' },
  moveLeft: { keys: ['ArrowLeft', 'KeyA'], gamepadButtons: [14], touchRegion: 'west' },
  moveRight: { keys: ['ArrowRight', 'KeyD'], gamepadButtons: [15], touchRegion: 'east' },
  action: { keys: ['Space', 'Enter'], gamepadButtons: [0], touchRegion: 'center' },
  menu: { keys: ['Escape'], gamepadButtons: [9] },
  dash: { keys: ['ShiftLeft', 'ShiftRight'], gamepadButtons: [1] },
  pause: { keys: ['KeyP'], gamepadButtons: [9] },
}

import { Sound } from '@babylonjs/core/Audio/sound'

import type { GameEvent } from '../../core/events/GameEvent.ts'
import type { EventBus } from '../../core/events/EventBus.ts'
import { ServiceLocator } from '../../core/ServiceLocator.ts'
import type { AppConfiguration } from '../../config/AppConfig.ts'

interface TrackedSound {
  id: string
  sound: Sound
}

/**
 * Manages music and sound effects playback.
 */
export class AudioManager {
  private readonly events: EventBus<GameEvent>
  private readonly sounds = new Map<string, TrackedSound>()
  private configuration: AppConfiguration | null = null

  public constructor(events: EventBus<GameEvent>) {
    this.events = events
  }

  /**
   * Initializes audio context and subscribes to relevant events.
   */
  public async initialize(): Promise<void> {
    this.configuration = ServiceLocator.resolve<AppConfiguration>('config')
    this.events.subscribe('audio:play', (event) => {
      if (typeof event.payload === 'string') {
        this.play(event.payload)
      }
    })
  }

  /**
   * Adjusts audio parameters each frame if required.
   */
  public update(_deltaTime: number): void {
    // Placeholder for dynamic volume ducking or adaptive soundtrack logic.
  }

  /**
   * Plays a sound by identifier.
   */
  public play(soundId: string): void {
    const tracked = this.sounds.get(soundId)
    if (!tracked) {
      // TODO: Implement dynamic loading of audio assets.
      return
    }

    tracked.sound.setVolume(this.resolveVolume())
    tracked.sound.play()
  }

  /**
   * Stops playback and releases resources.
   */
  public async dispose(): Promise<void> {
    for (const { sound } of this.sounds.values()) {
      sound.dispose()
    }

    this.sounds.clear()
  }

  private resolveVolume(): number {
    return this.configuration?.audio.masterVolume ?? 1
  }
}

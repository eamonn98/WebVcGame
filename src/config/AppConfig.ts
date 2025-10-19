export interface RenderSettings {
  pixelRatio: number
  enableWebGPU: boolean
  enableShadows: boolean
  antialias: boolean
}

export interface AudioSettings {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  muted: boolean
}

export interface GameplaySettings {
  difficulty: 'casual' | 'standard' | 'hardcore'
  enableTutorials: boolean
  enableAccessibilityOptions: boolean
}

export interface AppConfiguration {
  initialScene: string
  render: RenderSettings
  audio: AudioSettings
  gameplay: GameplaySettings
}

/**
 * Provides configuration helpers and environment-derived defaults.
 */
export class AppConfig {
  /**
   * Returns default configuration suitable for local development.
   */
  public static defaults(): AppConfiguration {
    return {
      initialScene: 'title',
      render: {
        pixelRatio: Math.min(window.devicePixelRatio ?? 1, 2),
        enableWebGPU: true,
        enableShadows: true,
        antialias: true,
      },
      audio: {
        masterVolume: 0.8,
        musicVolume: 0.6,
        sfxVolume: 0.9,
        muted: false,
      },
      gameplay: {
        difficulty: 'standard',
        enableTutorials: true,
        enableAccessibilityOptions: true,
      },
    }
  }

  /**
   * Convenience accessor for the initial scene key.
   */
  public static initialScene(): string {
    return AppConfig.defaults().initialScene
  }
}

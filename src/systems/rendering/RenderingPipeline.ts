import { Color4 } from '@babylonjs/core/Maths/math.color'
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline'

import type { Scene } from '@babylonjs/core/scene'

import type { EventBus } from '../../core/events/EventBus.ts'
import type { GameEvent } from '../../core/events/GameEvent.ts'
import { ServiceLocator } from '../../core/ServiceLocator.ts'
import type { AppConfiguration } from '../../config/AppConfig.ts'

/**
 * Configures Babylon render pipeline, post-processing, and tone mapping.
 */
export class RenderingPipeline {
  private readonly scene: Scene
  private readonly events: EventBus<GameEvent>
  private pipeline: DefaultRenderingPipeline | null = null
  private config: AppConfiguration | null = null

  public constructor(scene: Scene, events: EventBus<GameEvent>) {
    this.scene = scene
    this.events = events
  }

  /**
   * Sets up the default rendering pipeline based on configuration.
   */
  public async initialize(): Promise<void> {
    this.config = ServiceLocator.resolve<AppConfiguration>('config')

    this.scene.clearColor = new Color4(0.02, 0.02, 0.04, 1)

    const { render } = this.config
    const activeCamera = this.scene.activeCamera
    if (!activeCamera) {
      return
    }

    this.pipeline = new DefaultRenderingPipeline('defaultPipeline', true, this.scene, [activeCamera])
    this.pipeline.samples = render.antialias ? 4 : 1
    this.pipeline.fxaaEnabled = render.antialias
    this.pipeline.imageProcessingEnabled = true

    this.events.subscribe('render:toggleShadows', () => {
      if (!this.pipeline) {
        return
      }

      render.enableShadows = !render.enableShadows
      this.pipeline.sharpenEnabled = render.enableShadows
    })
  }

  /**
   * Allows runtime adjustments each frame.
   */
  public update(_deltaTime: number): void {
    // Reserved for future dynamic tone mapping or post-processing tweaks.
  }

  /**
   * Tears down Babylon resources.
   */
  public async dispose(): Promise<void> {
    this.pipeline?.dispose()
    this.pipeline = null
  }
}

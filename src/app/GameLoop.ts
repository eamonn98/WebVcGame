import type { Engine } from '@babylonjs/core/Engines/engine'
import type { Scene } from '@babylonjs/core/scene'

import type { Application } from './Application.ts'

/**
 * Orchestrates the Babylon render loop and forwards delta time to the application.
 */
export class GameLoop {
  private readonly engine: Engine
  private readonly scene: Scene
  private readonly application: Application
  private lastFrameTime = performance.now()
  private running = false

  public constructor(engine: Engine, scene: Scene, application: Application) {
    this.engine = engine
    this.scene = scene
    this.application = application
  }

  /**
   * Starts or resumes the render loop.
   */
  public start(): void {
    if (this.running) {
      return
    }

    this.running = true
    this.lastFrameTime = performance.now()

    this.engine.runRenderLoop(() => {
      const now = performance.now()
      const delta = (now - this.lastFrameTime) / 1000
      this.lastFrameTime = now

      this.application.update(delta)
      this.scene.render()
    })
  }

  /**
   * Stops the render loop.
   */
  public stop(): void {
    if (!this.running) {
      return
    }

    this.engine.stopRenderLoop()
    this.running = false
  }
}

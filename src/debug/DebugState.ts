import { Vector3 } from '@babylonjs/core/Maths/math.vector'

export class DebugState {
  public fps = 0
  public frameTimeMs = 0
  public region = 'unknown'
  public activeScene: string = 'unknown'
  public readonly playerPosition = new Vector3()
  public readonly playerVelocity = new Vector3()
  public readonly cameraPosition = new Vector3()
  public readonly cameraTarget = new Vector3()

  public updateFrameMetrics(deltaTime: number): void {
    this.frameTimeMs = deltaTime * 1000
    if (deltaTime > 0) {
      this.fps = 1 / deltaTime
    }
  }

  public setPlayer(position: Vector3, velocity: Vector3): void {
    this.playerPosition.copyFrom(position)
    this.playerVelocity.copyFrom(velocity)
  }

  public setCamera(position: Vector3, target: Vector3): void {
    this.cameraPosition.copyFrom(position)
    this.cameraTarget.copyFrom(target)
  }

  public setRegion(regionName: string): void {
    this.region = regionName
  }

  public setActiveScene(sceneKey: string): void {
    this.activeScene = sceneKey
  }
}

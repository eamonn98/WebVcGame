import type { Scene } from '@babylonjs/core/scene'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight'
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator'
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent'
import '@babylonjs/core/Culling/ray'

import type { GameEvent } from '../../core/events/GameEvent.ts'
import type { EventBus } from '../../core/events/EventBus.ts'
import { BaseScene } from '../BaseScene.ts'
import { ServiceLocator } from '../../core/ServiceLocator.ts'
import type { WorldManager } from '../../systems/world/WorldManager.ts'
import type { GeneratedWorld } from '../../systems/world/ProceduralWorldGenerator.ts'
import type { InputManager } from '../../input/InputManager.ts'
import { CharacterController } from '../../systems/gameplay/CharacterController.ts'
import type { DebugState } from '../../debug/DebugState.ts'

/**
 * Main exploration scene where the player navigates the overworld biome.
 */
export class OverworldScene extends BaseScene {
  private camera: UniversalCamera | null = null
  private worldManager: WorldManager | null = null
  private world: GeneratedWorld | null = null
  private inputManager: InputManager | null = null
  private characterController: CharacterController | null = null
  private debugState: DebugState | null = null
  private shadowGenerator: ShadowGenerator | null = null
  private readonly cameraBaseOffset = new Vector3(0, 11.5, -9)
  private readonly lookAheadDistance = 1.8
  private readonly cameraTargetOffset = new Vector3(0, 1, 0)
  private readonly positionLerpFactor = 0.1
  private readonly targetLerpFactor = 0.16
  private readonly desiredCameraPosition = new Vector3()
  private readonly cameraTarget = new Vector3()
  private readonly tmpDirection = new Vector3()
  private readonly tmpTarget = new Vector3()

  public constructor(scene: Scene, events: EventBus<GameEvent>) {
    super(scene, events)
  }

  /** @inheritdoc */
  public async preload(): Promise<void> {
    // Reserve for asset preloading.
  }

  /** @inheritdoc */
  public async create(): Promise<void> {
    const canvas = this.scene.getEngine().getRenderingCanvas()
    this.camera = new UniversalCamera('overworldCamera', new Vector3(0, 8, -12), this.scene)
    if (canvas) {
      this.camera.attachControl(canvas, true)
    }

    this.scene.activeCamera = this.camera
    this.scene.collisionsEnabled = false
    this.camera.checkCollisions = false
    this.camera.applyGravity = false
    this.camera.inertia = 0
    this.camera.speed = 0
    this.camera.rotation.set(0, 0, 0)
    this.camera.minZ = 0.1
    this.camera.maxZ = 250
    this.camera.inputs.clear()
    this.camera.fov = 0.8

    this.worldManager = ServiceLocator.resolve<WorldManager>('worldManager')
    this.world = this.worldManager.build(this.scene)

    this.inputManager = ServiceLocator.resolve<InputManager>('inputManager')
    this.characterController = new CharacterController(this.scene, this.inputManager, this.world)
    this.debugState = ServiceLocator.resolve<DebugState>('debugState')

    const startPosition = this.characterController.getPosition()
    this.camera.position = startPosition.add(this.cameraBaseOffset)
    this.cameraTarget.copyFrom(startPosition)
    this.camera.setTarget(this.cameraTarget.add(this.cameraTargetOffset))

    this.debugState?.setPlayer(startPosition, this.characterController.getVelocity())
    this.debugState?.setCamera(this.camera.position, this.cameraTarget)

    const hemiLight = new HemisphericLight('overworldAmbient', new Vector3(0.25, 1, -0.15), this.scene)
    hemiLight.intensity = 0.3
    hemiLight.groundColor = new Color3(0.18, 0.16, 0.22)
    hemiLight.diffuse = new Color3(0.9, 0.88, 0.84)

    const sunDirection = new Vector3(-0.45, -0.9, 0.35)
    const sunLight = new DirectionalLight('overworldSun', sunDirection.normalize(), this.scene)
    sunLight.position = new Vector3(30, 40, -20)
    sunLight.intensity = 1.4
    sunLight.shadowMinZ = 0.1
    sunLight.shadowMaxZ = 150
    sunLight.autoCalcShadowZBounds = true

    this.shadowGenerator = new ShadowGenerator(2048, sunLight)
    this.shadowGenerator.usePercentageCloserFiltering = true
    this.shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_HIGH
    this.shadowGenerator.bias = 0.0001
    this.shadowGenerator.normalBias = 0.01
    this.shadowGenerator.forceBackFacesOnly = true
    this.shadowGenerator.darkness = 0.6

    const shadowCaster = this.characterController.getShadowCaster()
    this.shadowGenerator.addShadowCaster(shadowCaster, true)

    this.events.publish({ type: 'world:changeRegion', payload: 'glade-entry' })
  }

  /** @inheritdoc */
  public update(deltaTime: number): void {
    this.worldManager?.update(deltaTime)
    this.characterController?.update(deltaTime)
    this.updateCamera(deltaTime)
  }

  /** @inheritdoc */
  public onEvent(event: GameEvent): void {
    if (event.type === 'world:regionLoaded' && event.payload) {
      const payload = event.payload as { biome?: { ambientColor: [number, number, number] } }
      if (payload?.biome?.ambientColor) {
        const [r, g, b] = payload.biome.ambientColor
        this.scene.clearColor = new Color4(r * 0.2, g * 0.2, b * 0.2, 1)
      }
      if (typeof (event.payload as { region?: { name?: string } })?.region?.name === 'string') {
        const regionName = (event.payload as { region?: { name?: string } }).region?.name ?? 'unknown'
        this.debugState?.setRegion(regionName)
      }
    }
  }

  /** @inheritdoc */
  public async dispose(): Promise<void> {
    this.camera?.dispose()
    this.camera = null
    this.shadowGenerator?.dispose()
    this.shadowGenerator = null
    this.characterController?.dispose()
    this.characterController = null
    this.worldManager?.clearGeneratedWorld()
    this.world = null
  }

  private updateCamera(deltaTime: number): void {
    if (!this.camera || !this.characterController) {
      return
    }

    const targetPosition = this.characterController.getPosition()
    const velocity = this.characterController.getVelocity()

    this.desiredCameraPosition.copyFrom(targetPosition).addInPlace(this.cameraBaseOffset)
    if (this.desiredCameraPosition.y < targetPosition.y + 4) {
      this.desiredCameraPosition.y = targetPosition.y + 4
    }

    const positionLerp = this.smoothingFactor(this.positionLerpFactor, deltaTime)
    Vector3.LerpToRef(this.camera.position, this.desiredCameraPosition, positionLerp, this.camera.position)

    this.cameraTarget.copyFrom(targetPosition)
    if (velocity.lengthSquared() > 0.01) {
      this.tmpDirection.copyFrom(velocity).normalize()
      const speedRatio = Math.min(1, velocity.length() / this.characterController.getMovementSpeed())
      this.cameraTarget.addInPlace(this.tmpDirection.scale(this.lookAheadDistance * speedRatio))
    }
    this.cameraTarget.addInPlace(this.cameraTargetOffset)

    const targetLerp = this.smoothingFactor(this.targetLerpFactor, deltaTime)
    const currentTarget = this.camera.getTarget()
    Vector3.LerpToRef(currentTarget, this.cameraTarget, targetLerp, this.tmpTarget)
    this.camera.setTarget(this.tmpTarget)

    if (this.debugState && this.characterController) {
      this.debugState.setPlayer(this.characterController.getPosition(), this.characterController.getVelocity())
      this.debugState.setCamera(this.camera.position, this.tmpTarget)
    }
  }

  private smoothingFactor(base: number, deltaTime: number): number {
    const clampedDelta = Math.max(deltaTime, 0.0001)
    const steps = clampedDelta * 60
    return 1 - Math.pow(1 - base, steps)
  }
}

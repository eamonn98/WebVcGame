import type { Scene } from '@babylonjs/core/scene'
import { Color4 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { SpriteManager } from '@babylonjs/core/Sprites/spriteManager'
import { Sprite } from '@babylonjs/core/Sprites/sprite'
import '@babylonjs/core/Sprites/spriteSceneComponent'

import type { GameEvent } from '../core/events/GameEvent.ts'
import type { EventBus } from '../core/events/EventBus.ts'
import { BaseScene } from './BaseScene.ts'

/**
 * Displays the title screen, splash branding, and primer UI elements.
 */
export class TitleScene extends BaseScene {
  private camera: ArcRotateCamera | null = null
  private spriteManager: SpriteManager | null = null
  private heroSprite: Sprite | null = null

  public constructor(scene: Scene, events: EventBus<GameEvent>) {
    super(scene, events)
  }

  /** @inheritdoc */
  public async preload(): Promise<void> {
    // TODO: Load title screen assets (logos, background music).
  }

  /** @inheritdoc */
  public async create(): Promise<void> {
    this.scene.clearColor = new Color4(0, 0, 0, 1)

    this.camera = new ArcRotateCamera('titleCamera', Math.PI / 2, Math.PI / 3, 6, Vector3.Zero(), this.scene)
    this.scene.activeCamera = this.camera
    const canvas = this.scene.getEngine().getRenderingCanvas()
    if (canvas) {
      this.camera.attachControl(canvas, true)
    }

    new HemisphericLight('titleHemiLight', new Vector3(0, 1, 0), this.scene)

    this.spriteManager = new SpriteManager('titleSprites', '/assets/spritesheets/mvc-sprites.png', 1, { width: 48, height: 48 }, this.scene)
    this.heroSprite = new Sprite('hero', this.spriteManager)
    this.heroSprite.size = 3
    this.heroSprite.position.z = 2

    // Simple ground to guarantee something visible
    const ground = MeshBuilder.CreateGround('titleGround', { width: 10, height: 10 }, this.scene)
    ground.position.y = -1
  }

  /** @inheritdoc */
  public update(_deltaTime: number): void {
    // TODO: Update title animations or respond to selection input.
  }

  /** @inheritdoc */
  public onEvent(event: GameEvent): void {
    if (event.type === 'input:actionPressed' && event.payload === 'action') {
      this.events.publish({ type: 'scene:requestTransition', payload: 'overworld' })
    }
  }

  /** @inheritdoc */
  public async dispose(): Promise<void> {
    this.camera?.dispose()
    this.camera = null
    this.heroSprite?.dispose()
    this.heroSprite = null
    this.spriteManager?.dispose()
    this.spriteManager = null
  }
}

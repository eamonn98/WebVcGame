import './style.css'
import { Engine } from '@babylonjs/core/Engines/engine'
import { WebGPUEngine } from '@babylonjs/core/Engines/webgpuEngine'
import { Scene } from '@babylonjs/core/scene'
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { SpriteManager } from '@babylonjs/core/Sprites/spriteManager'
import { Sprite } from '@babylonjs/core/Sprites/sprite'

const canvasElement = document.getElementById('renderCanvas')

if (!(canvasElement instanceof HTMLCanvasElement)) {
  throw new Error('Canvas element `renderCanvas` was not found in the DOM.')
}

const canvas = canvasElement

/**
 * Creates the most capable Babylon engine available for the current browser, preferring WebGPU.
 */
async function createEngine(target: HTMLCanvasElement): Promise<Engine | WebGPUEngine> {
  const webGpuSupported = await WebGPUEngine.IsSupportedAsync
  if (webGpuSupported) {
    const engine = new WebGPUEngine(target, { adaptToDeviceRatio: true })
    await engine.initAsync()
    return engine
  }

  return new Engine(target, true, { adaptToDeviceRatio: true })
}

/**
 * Boots the Babylon scene and starts the render loop.
 */
async function init(): Promise<void> {
  const engine = await createEngine(canvas)
  const scene = new Scene(engine)

  const camera = new ArcRotateCamera('camera', Math.PI / 2, Math.PI / 3, 10, Vector3.Zero(), scene)
  camera.attachControl(canvas, true)

  new HemisphericLight('hemi', new Vector3(0, 1, 0), scene)

  const spriteManager = new SpriteManager(
    'characterSprites',
    '/assets/spritesheets/mvc-sprites.png',
    1,
    {
      width: 64,
      height: 64,
    },
    scene,
  )

  const character = new Sprite('character', spriteManager)
  character.position = Vector3.Zero()
  character.size = 3

  engine.runRenderLoop(() => {
    scene.render()
  })

  window.addEventListener('resize', () => {
    engine.resize()
  })
}

init().catch((error) => {
  console.error('Failed to initialize Babylon scene', error)
})

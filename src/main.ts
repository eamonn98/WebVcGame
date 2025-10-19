import './style.css'
import { Engine } from '@babylonjs/core/Engines/engine'
import { WebGPUEngine } from '@babylonjs/core/Engines/webgpuEngine'
import { Scene } from '@babylonjs/core/scene'

import { Application } from './app/Application.ts'
import { GameLoop } from './app/GameLoop.ts'

const canvasElement = document.getElementById('renderCanvas')

if (!(canvasElement instanceof HTMLCanvasElement)) {
  throw new Error('Canvas element `renderCanvas` was not found in the DOM.')
}

const canvas = canvasElement

/**
 * Creates the most capable Babylon engine available for the current browser, preferring WebGPU.
 */
async function createEngine(target: HTMLCanvasElement): Promise<Engine> {
  if (await WebGPUEngine.IsSupportedAsync) {
    const webGpuEngine = new WebGPUEngine(target, {
      adaptToDeviceRatio: true,
    })
    await webGpuEngine.initAsync()
    return webGpuEngine as unknown as Engine
  }

  return new Engine(target, true, { adaptToDeviceRatio: true })
}

/**
 * Boots the application framework and starts the render loop.
 */
async function init(): Promise<void> {
  const engine = await createEngine(canvas)
  const scene = new Scene(engine)

  const application = new Application(engine, scene)
  await application.initialize()

  const loop = new GameLoop(engine, scene, application)
  loop.start()

  window.addEventListener('resize', () => {
    engine.resize()
  })
}

init().catch((error) => {
  console.error('Failed to initialize Babylon scene', error)
})

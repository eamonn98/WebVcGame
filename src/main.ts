import './style.css'
import { Engine } from '@babylonjs/core/Engines/engine'
import { WebGPUEngine } from '@babylonjs/core/Engines/webgpuEngine'
import { Scene } from '@babylonjs/core/scene'
import { createApp, type App as VueApp } from 'vue'

import { Application } from './app/Application.ts'
import { GameLoop } from './app/GameLoop.ts'
import DebugOverlay from './ui/DebugOverlay.vue'
import vuetify from './ui/vuetify.ts'
import { AppConfig } from './config/AppConfig.ts'

const canvasElement = document.getElementById('renderCanvas')

if (!(canvasElement instanceof HTMLCanvasElement)) {
  throw new Error('Canvas element `renderCanvas` was not found in the DOM.')
}

const canvas = canvasElement

/**
 * Creates the most capable Babylon engine available for the current browser, preferring WebGPU.
 */
async function createEngine(target: HTMLCanvasElement): Promise<Engine> {
  const preferWebGPU = AppConfig.defaults().render.enableWebGPU
  if (preferWebGPU) {
    try {
      if (await WebGPUEngine.IsSupportedAsync) {
        const webGpuEngine = new WebGPUEngine(target, {
          adaptToDeviceRatio: true,
        })
        await webGpuEngine.initAsync()
        return webGpuEngine as unknown as Engine
      }
    } catch (err) {
      console.warn('WebGPU initialization failed, falling back to WebGL.', err)
    }
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

  mountDebugOverlay(application)

  window.addEventListener('resize', () => {
    engine.resize()
  })
}

init().catch((error) => {
  console.error('Failed to initialize Babylon scene', error)
})

let overlayApp: VueApp<Element> | null = null

function mountDebugOverlay(application: Application): void {
  const uiRoot = document.getElementById('ui-root')
  if (!uiRoot) {
    console.warn('UI root element not found; debug overlay will not render.')
    return
  }

  overlayApp = createApp(DebugOverlay, { debugState: application.getDebugState() })
  overlayApp.use(vuetify)
  overlayApp.mount(uiRoot)
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    overlayApp?.unmount()
    overlayApp = null
  })
}

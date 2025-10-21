/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

// Allow side-effect style imports with strict noUncheckedSideEffectImports
declare module 'vuetify/styles' {
  const styles: unknown
  export default styles
}

declare module '@mdi/font/css/materialdesignicons.css' {
  const content: unknown
  export default content
}

declare module '@babylonjs/core/Shaders/*' {
  const shader: string
  export default shader
}

declare module '@babylonjs/core/ShadersWGSL/*' {
  const shader: string
  export default shader
}

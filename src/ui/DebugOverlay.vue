<script setup lang="ts">
import { onMounted, onUnmounted, reactive } from 'vue'

import type { DebugState } from '../debug/DebugState'

const props = defineProps<{
  debugState: DebugState
}>()

const state = reactive({
  fps: 0,
  frameTimeMs: 0,
  region: 'unknown',
  playerPosition: { x: 0, y: 0, z: 0 },
  playerVelocity: { x: 0, y: 0, z: 0 },
  cameraPosition: { x: 0, y: 0, z: 0 },
  cameraTarget: { x: 0, y: 0, z: 0 },
})

let intervalHandle: number | null = null

const pullDebugState = (): void => {
  const { debugState } = props
  state.fps = Number.isFinite(debugState.fps) ? debugState.fps : 0
  state.frameTimeMs = debugState.frameTimeMs
  state.region = `${debugState.activeScene} · ${debugState.region}`
  state.playerPosition = {
    x: Number(debugState.playerPosition.x.toFixed(2)),
    y: Number(debugState.playerPosition.y.toFixed(2)),
    z: Number(debugState.playerPosition.z.toFixed(2)),
  }
  state.playerVelocity = {
    x: Number(debugState.playerVelocity.x.toFixed(2)),
    y: Number(debugState.playerVelocity.y.toFixed(2)),
    z: Number(debugState.playerVelocity.z.toFixed(2)),
  }
  state.cameraPosition = {
    x: Number(debugState.cameraPosition.x.toFixed(2)),
    y: Number(debugState.cameraPosition.y.toFixed(2)),
    z: Number(debugState.cameraPosition.z.toFixed(2)),
  }
  state.cameraTarget = {
    x: Number(debugState.cameraTarget.x.toFixed(2)),
    y: Number(debugState.cameraTarget.y.toFixed(2)),
    z: Number(debugState.cameraTarget.z.toFixed(2)),
  }

}

onMounted(() => {
  pullDebugState()
  intervalHandle = window.setInterval(pullDebugState, 500)
})

onUnmounted(() => {
  if (intervalHandle !== null) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
})

const toVectorText = (vector: { x: number; y: number; z: number }): string =>
  `${vector.x.toFixed(2)}, ${vector.y.toFixed(2)}, ${vector.z.toFixed(2)}`
</script>

<template>
  <v-app class="debug-app" theme="dark">
    <v-container class="pa-0" fluid>
      <v-card class="debug-card" elevation="10">
        <v-card-title class="debug-title">Debug Overlay</v-card-title>
        <v-card-subtitle class="debug-subtitle">Region · {{ state.region }}</v-card-subtitle>
        <v-card-text class="debug-grid">
          <div class="debug-row">
            <span class="debug-label">FPS</span>
            <span class="debug-value">{{ state.fps.toFixed(1) }}</span>
          </div>
          <div class="debug-row">
            <span class="debug-label">Frame Time</span>
            <span class="debug-value">{{ state.frameTimeMs.toFixed(2) }} ms</span>
          </div>
          <v-divider class="debug-divider" thickness="1"></v-divider>
          <div class="debug-row">
            <span class="debug-label">Player Pos</span>
            <span class="debug-value">{{ toVectorText(state.playerPosition) }}</span>
          </div>
          <div class="debug-row">
            <span class="debug-label">Player Vel</span>
            <span class="debug-value">{{ toVectorText(state.playerVelocity) }}</span>
          </div>
          <v-divider class="debug-divider" thickness="1"></v-divider>
          <div class="debug-row">
            <span class="debug-label">Camera Pos</span>
            <span class="debug-value">{{ toVectorText(state.cameraPosition) }}</span>
          </div>
          <div class="debug-row">
            <span class="debug-label">Camera Target</span>
            <span class="debug-value">{{ toVectorText(state.cameraTarget) }}</span>
          </div>
        </v-card-text>
      </v-card>
    </v-container>
  </v-app>
</template>

<style scoped>
.debug-app {
  background-color: transparent !important;
  pointer-events: none;
}

:deep(.debug-app.v-application) {
  background-color: transparent !important;
  position: static;
  width: auto;
  height: auto;
}

:deep(.debug-app .v-application__wrap) {
  min-height: auto !important;
  background-color: transparent !important;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}

:deep(.debug-app .v-container) {
  width: auto !important;
  padding: 0 !important;
}

.debug-card {
  background-color: rgba(20, 24, 32, 0.9);
  border: 1px solid rgba(98, 124, 179, 0.35);
  color: #ecf2ff;
  pointer-events: auto;
  min-width: 220px;
}

.debug-subtitle {
  color: rgba(173, 190, 227, 0.75);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding-top: 0;
}

.debug-title {
  font-weight: 600;
}

.debug-grid {
  display: grid;
  gap: 4px;
}

.debug-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.debug-label {
  color: rgba(173, 190, 227, 0.85);
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
}

.debug-value {
  font-weight: 600;
}

.debug-divider {
  margin: 6px 0;
  opacity: 0.3;
}
</style>

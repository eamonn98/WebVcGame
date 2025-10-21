# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Babylon.js action-adventure prototype built with TypeScript, Vue 3, and Vuetify. The project aims to create a cinematic WebGL experience with toon-shaded meshes and sprite billboards in an HD-2D style. It uses Bun as the JavaScript runtime for development and Vite for bundling.

## Development Commands

### Development Server
```bash
bun run dev
```
Starts the Vite development server with hot reload

### Build
```bash
bun run build
```
Compiles TypeScript and builds the production bundle using Vite

### Linting
```bash
bun run lint
```
Runs ESLint on TypeScript files in the src directory

### Preview Production Build
```bash
bun run preview
```
Serves the production build locally for testing

### Testing
The project uses Bun's built-in test runner:
```bash
bun test
```
Note: Test files should be placed in the `src/testing/` directory or use `.test.ts` suffix

## Architecture Overview

### Core Systems Architecture
The application follows a service-oriented architecture with clear separation of concerns:

- **Application Layer** (`src/app/`): Contains the main `Application` class that orchestrates all systems and `GameLoop` for render loop management
- **Service Locator Pattern** (`src/core/ServiceLocator.ts`): Provides global access to singleton services like engine, scene, managers
- **Event-Driven Communication** (`src/core/events/`): Central `EventBus` for decoupled system communication using typed `GameEvent`s
- **Scene Management** (`src/core/SceneManager.ts`): Handles scene lifecycle transitions with preload/create/update/dispose phases

### Scene System
Scenes inherit from `BaseScene` and follow a structured lifecycle:
1. **Preload**: Load assets and prepare resources
2. **Create**: Initialize scene content and systems
3. **Update**: Per-frame logic updates
4. **Dispose**: Clean up resources

Scene types are defined in `SceneTypes.ts` and registered in `SceneRegistry.ts`. Current scenes:
- `TitleScene`: Main menu
- `OverworldScene`: Main game world
- `CombatScene`: Battle encounters
- `LoadingScene`: Asset loading states

### System Managers
Each system manager follows the initialize/update/dispose pattern:

- **RenderingPipeline**: Post-processing, tone mapping, anti-aliasing
- **WorldManager**: Procedural world generation, biome management, region streaming
- **GameplayCoordinator**: Game logic coordination
- **AudioManager**: Sound and music management
- **InputManager**: Cross-platform input handling (keyboard, gamepad, touch)
- **HudManager**: UI overlay management

### Engine Integration
The project supports both WebGL and WebGPU engines, automatically selecting the best available option. The main entry point (`src/main.ts`) creates the Babylon.js engine and bootstraps the application.

### UI Layer
Uses Vue 3 with Vuetify for UI components, integrated through a `DebugOverlay` component that mounts to the `#ui-root` element. The UI system is designed to overlay the 3D canvas for debug information and game UI.

## Key Configuration

### TypeScript Configuration
- Target: ES2022 with strict type checking
- Module resolution: bundler mode for Vite compatibility
- Includes Babylon.js and Vuetify type definitions

### Build System
- **Vite** with Vue plugin and Vuetify auto-import
- **Bun** for package management and development tasks
- **ESLint** with TypeScript support for code quality

### Rendering Engine
- Supports both WebGL and WebGPU (prefers WebGPU when available)
- Default rendering pipeline with configurable post-processing
- Adaptive device pixel ratio with shadows and anti-aliasing

## Development Patterns

### Service Registration
Services are registered in `Application.ts` constructor and resolved throughout the codebase:
```typescript
ServiceLocator.register('serviceName', instance)
const service = ServiceLocator.resolve<ServiceType>('serviceName')
```

### Event System
Use the event bus for cross-system communication:
```typescript
events.publish({ type: 'eventType', payload: data })
events.subscribe('eventType', handler)
```

### Scene Development
New scenes should:
1. Extend `BaseScene`
2. Be registered in `SceneRegistry.ts`
3. Have their type added to `SceneTypes.ts`
4. Follow the preload → create → update → dispose lifecycle

### Asset Management
Assets should be placed in `src/assets/` and loaded through Babylon.js asset pipeline. The world system supports `.glb` models and procedural generation.

## File Structure Notes

- `src/app/`: Application bootstrap and main loop
- `src/core/`: Service locator, scene management, event system
- `src/scenes/`: Game scenes (title, overworld, combat, loading)
- `src/systems/`: System managers (audio, rendering, world, gameplay, UI)
- `src/input/`: Input management and bindings
- `src/config/`: Application configuration
- `src/data/`: Game data and world state
- `src/ui/`: Vue components and Vuetify setup
- `src/debug/`: Debug utilities and state management
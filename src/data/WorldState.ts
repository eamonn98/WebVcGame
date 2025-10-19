export interface BiomeDefinition {
  id: string
  name: string
  ambientColor: [number, number, number]
  musicTrack: string
}

export interface WorldRegion {
  id: string
  biome: string
  connections: string[]
}

/**
 * Holds persistent world data used by the overworld scene.
 */
export class WorldState {
  private readonly biomes = new Map<string, BiomeDefinition>()
  private readonly regions = new Map<string, WorldRegion>()

  /**
   * Seeds the world state with initial biome and region definitions.
   */
  public seed(biomes: BiomeDefinition[], regions: WorldRegion[]): void {
    for (const biome of biomes) {
      this.biomes.set(biome.id, biome)
    }

    for (const region of regions) {
      this.regions.set(region.id, region)
    }
  }

  /**
   * Retrieves a biome definition by id.
   */
  public getBiome(id: string): BiomeDefinition | undefined {
    return this.biomes.get(id)
  }

  /**
   * Retrieves a region entry by id.
   */
  public getRegion(id: string): WorldRegion | undefined {
    return this.regions.get(id)
  }
}

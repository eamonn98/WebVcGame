type ServiceRegistry = Map<string, unknown>

/**
 * Lightweight service locator to provide globally accessible singletons.
 */
export class ServiceLocator {
  private static readonly registry: ServiceRegistry = new Map()

  /**
   * Registers a service instance under a unique key.
   */
  public static register<T>(key: string, instance: T): void {
    ServiceLocator.registry.set(key, instance)
  }

  /**
   * Retrieves a previously registered service instance.
   */
  public static resolve<T>(key: string): T {
    if (!ServiceLocator.registry.has(key)) {
      throw new Error(`Service '${key}' has not been registered.`)
    }

    return ServiceLocator.registry.get(key) as T
  }

  /**
   * Checks whether a service is registered.
   */
  public static has(key: string): boolean {
    return ServiceLocator.registry.has(key)
  }

  /**
   * Clears all registered services.
   */
  public static reset(): void {
    ServiceLocator.registry.clear()
  }
}

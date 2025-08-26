// A helper type to represent a class constructor that creates an instance of type T.
export type Class<T> = new (...args: any[]) => T;

// Define the scope for dependency instances
type Scope = 'singleton' | 'transient';

// Define the shape of a registration entry
interface Registration {
  factory: (container: Container) => any;
  scope: Scope;
}

/**
 * A simple Dependency Injection (DI) Container.
 */
export class Container {
  private registry = new Map<any, Registration>();
  private singletons = new Map<any, any>();

  /**
   * Registers a service with the container.
   * @param token The class constructor or identifier for the service.
   * @param factory A function that creates an instance of the service.
   * @param scope 'singleton' for a single instance, 'transient' for a new instance.
   */
  public register<T>(
    token: Class<T>, // register can still accept any token (like strings or symbols)
    factory: (container: Container) => T,
    scope: Scope = 'transient'
  ): void {
    this.registry.set(token, { factory, scope });
  }

  /**
   * Resolves a service from the container. Type T is inferred from the token.
   * @param token The class constructor for the service.
   * @returns An instance of the requested service.
   */
  public get<T>(token: Class<T>): T {
    const registration = this.registry.get(token);

    if (!registration) {
      throw new Error(`Service not registered for token: ${token.name}`);
    }

    if (registration.scope === 'singleton') {
      if (this.singletons.has(token)) {
        return this.singletons.get(token);
      }
      const instance = registration.factory(this);
      this.singletons.set(token, instance);
      return instance;
    }

    return registration.factory(this);
  }
}
// A helper type to represent a class constructor that creates an instance of type T.
export type DIClass<T> = new (...args: any[]) => T;

// Define the scope for dependency instances.
export type DIScope = 'singleton' | 'transient';

// Define the shape of a registration entry.
interface DIRegistration {
  factory: (container: any) => any;
  scope: DIScope;
}

// A type to map service names (as strings) to their class types.
// e.g., { LoggerService: LoggerService, DatabaseService: DatabaseService }
type DIServiceRegistry = Record<string, any>;

/**
 * This is the core of the static typing. It's a "mapped type" that takes a
 * ServiceRegistry `R` and creates a new type. For each key `K` in the registry,
 * it adds a method named `getK` that returns an instance of the corresponding service type.
 *
 * For example, if R is `{ LoggerService: LoggerService }`, this type will be:
 * { getLoggerService: () => LoggerService }
 */
type DITypedContainer<R extends DIServiceRegistry> = DIContainer<R> & {
  [K in keyof R as `get${string & K}`]: () => R[K]
};

/**
 * A Dependency Injection (DI) Container that provides static typing for resolved services.
 */
export class DIContainer<R extends DIServiceRegistry = {}> {
  private registry = new Map<string, DIRegistration>();
  private singletons = new Map<string, any>();
  private proxy: any;

  /**
   * The constructor returns a Proxy. This is the runtime magic that intercepts
   * calls to methods like `getLoggerService()`. It parses the method name,
   * finds the corresponding service class in the registry, and resolves it.
   */
  constructor() {
    // Store a reference to the proxy so we can use it in factory functions
    this.proxy = new Proxy(this, {
      get: (target, prop, receiver) => {
        // Intercept any property access that starts with "get".
        if (typeof prop === 'string' && prop.startsWith('get')) {
          // Extract the service name, e.g., "getLoggerService" -> "LoggerService".
          const serviceName = prop.substring(3);

          // Find the registered service by service name.
          if (target.registry.has(serviceName)) {
            // If found, return a function that resolves the service.
            return () => target.resolveByName(serviceName);
          }
        }
        // For any other property (like 'register'), perform the default behavior.
        return Reflect.get(target, prop, receiver);
      }
    });
    
    return this.proxy as unknown as DITypedContainer<R>;
  }

  /**
   * Registers a service with explicit service name (fully type-safe).
   */
  public register<T, N extends string>(
    serviceName: N,
    factory: (container: DITypedContainer<R>) => T,
    scope: DIScope = 'transient'
  ): DITypedContainer<R & Record<N, T>> {
    this.registry.set(serviceName, { factory, scope });
    return this as unknown as DITypedContainer<R & Record<N, T>>;
  }

  /**
   * Resolves a service by service name.
   */
  private resolveByName<T>(serviceName: string): T {
    const registration = this.registry.get(serviceName);

    if (!registration) {
      throw new Error(`Service not registered: ${serviceName}`);
    }

    if (registration.scope === 'singleton') {
      if (!this.singletons.has(serviceName)) {
        // The factory is called with the proxy container,
        // allowing dependencies to be resolved using the `get...` syntax.
        const instance = registration.factory(this.proxy);
        this.singletons.set(serviceName, instance);
      }
      return this.singletons.get(serviceName);
    }

    return registration.factory(this.proxy);
  }
}
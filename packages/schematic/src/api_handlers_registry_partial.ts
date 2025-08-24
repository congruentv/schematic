import { IApiContractDefinition, ValidateApiContractDefinition } from "./api_contract.js";
import { ApiHandlersRegistry, MethodEndpointHandlerRegistryEntry } from "./api_handlers_registry.js";
import { HttpMethodEndpoint } from "./http_method_endpoint.js";
import { ExtractPathParamsFromPartialPath } from "./typed_path_params.js";

export function partialPathString<
  TApiDef extends IApiContractDefinition & ValidateApiContractDefinition<TApiDef>,
  const TPath extends PartialPath<TApiDef>
>(
  _apiReg: ApiHandlersRegistry<TApiDef, "">,
  path: TPath
): string {
  return path as string;
}

/**
 * Creates a partial API registry by navigating to a sub-path in the API structure.
 * 
 * This function allows you to create a scoped registry that represents a subset of your API,
 * preserving path parameter context for type-safe handler registration.
 * 
 * @example
 * ```typescript
 * const api = createRegistry(contract);
 * const greetPartial = partial(api, '/greet/:name');
 * 
 * // Now you can register handlers on the partial registry
 * register(greetPartial, 'GET /preferred-salute/:salute', async (req) => {
 *   const { name, salute } = req.pathParams; // Both parameters are available
 *   return `${salute}, ${name}!`;
 * });
 * ```
 * 
 * @param apiReg - The root API registry
 * @param path - The partial path to navigate to (must start with '/')
 * @returns A partial registry representing the sub-API at the specified path
 */
export function partial<
  TApiDef extends IApiContractDefinition & ValidateApiContractDefinition<TApiDef>,
  const TPartialPath extends string & PartialPath<TApiDef>
>(
  apiReg: ApiHandlersRegistry<TApiDef, "">,
  path: TPartialPath
): ApiHandlersRegistry<TApiDef, ExtractPathParamsFromPartialPath<TPartialPath>> {
  const pathSegments = path.split('/').filter((segment: string) => segment.length > 0);
  let current: any = apiReg;
  
  for (const segment of pathSegments) {
    if (current[segment] instanceof MethodEndpointHandlerRegistryEntry) {
      throw new Error(`Path "${path}" is not partial`);
    } else if (typeof current[segment] === 'object') {
      current = current[segment];
    } else {
      throw new Error(`Path segment "${segment}" not found in API handlers registry`);
    }
  }
  
  return current as any;
}

type PartialPath<TDef, BasePath extends string = ""> = {
  [K in keyof TDef & string]:
    TDef[K] extends HttpMethodEndpoint<infer _TEndpointDef>
      ? never
      : TDef[K] extends object
        ? `${BasePath}/${K}` | PartialPath<TDef[K], `${BasePath}/${K}`>
        : never
}[keyof TDef & string];
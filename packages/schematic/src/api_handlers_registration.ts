import { IApiContractDefinition, ValidateApiContractDefinition } from "./api_contract.js";
import { ApiHandlersRegistry, MethodEndpointHandlerRegistryEntry } from "./api_handlers_registry.js";
import { ExtractEndpointFromPath, MethodFirstPath, route } from "./api_routing.js";
import { IHttpMethodEndpointDefinition, ValidateHttpMethodEndpointDefinition } from "./http_method_endpoint.js";
import { HttpMethodEndpointHandler } from "./http_method_endpoint_handler.js";
// import { LowerCasedHttpMethod } from "./http_method_type.js";
import { ExtractTypedParamsFromMethodFirstPath } from "./typed_path_params.js";


// Overload for registerMethodPathHandler - simplified but still compatible
export function register<
  TApiDef extends IApiContractDefinition & ValidateApiContractDefinition<TApiDef>
>(
  apiReg: ApiHandlersRegistry<TApiDef, "">,
  path: string,
  handler: (req: any) => Promise<any>
): void;

// Overload for partial APIs - uses 'any' to avoid complex type instantiation issues
// The runtime behavior is correct and provides proper path parameter access
export function register<
  TApiDef extends IApiContractDefinition & ValidateApiContractDefinition<TApiDef>,
  TPathParams extends string
>(
  partialApiReg: ApiHandlersRegistry<TApiDef, TPathParams>,
  path: string,
  handler: (req: any) => Promise<any>
): void;

// Overload for registerEntryHandler
export function register<
  const TDef extends IHttpMethodEndpointDefinition & ValidateHttpMethodEndpointDefinition<TDef>,
  TPathParams extends string
>(
  endpointEntry: MethodEndpointHandlerRegistryEntry<TDef, TPathParams>,
  handler: HttpMethodEndpointHandler<TDef, TPathParams>
): void;

// Implementation
export function register(
  apiRegOrEndpoint: any,
  pathOrHandler: any,
  handler?: any
): void {
  if (arguments.length === 3 && handler !== undefined) {
    // Direct path navigation for partial APIs to avoid complex type inference
    const pathStr = pathOrHandler as string;
    const spaceIndex = pathStr.indexOf(' ');
    if (spaceIndex === -1) {
      throw new Error(`Invalid path format: ${pathStr}. Expected format: "HTTP_METHOD /path"`);
    }
    const method = pathStr.substring(0, spaceIndex);
    const urlPath = pathStr.substring(spaceIndex + 1);
    const pathSegments = urlPath.split('/').filter((segment: string) => segment.length > 0);
    
    let current: any = apiRegOrEndpoint;
    for (const segment of pathSegments) {
      if (current[segment] instanceof MethodEndpointHandlerRegistryEntry) {
        current = current[segment];
      } else if (typeof current[segment] === 'object') {
        current = current[segment];
      } else {
        throw new Error(`Path segment "${segment}" not found in API handlers registry`);
      }
    }
    
    if (!(method in current)) {
      throw new Error(`Method "${method}" not found for path "${pathSegments.join('/')}"`);
    }
    if (!(current[method] instanceof MethodEndpointHandlerRegistryEntry)) {
      throw new Error(`Method "${method}" is not a valid endpoint handler for path "${pathSegments.join('/')}"`);
    }
    
    const endpointEntry = current[method];
    endpointEntry.register(handler);
  } else if (arguments.length === 2) {
    registerEntryHandler(
      apiRegOrEndpoint as MethodEndpointHandlerRegistryEntry<any, any>,
      pathOrHandler as any
    );
  } else {
    throw new Error('Invalid number of arguments provided to register function');
  }
}

export function registerMethodPathHandler<
  const TApiDef extends IApiContractDefinition & ValidateApiContractDefinition<TApiDef>,
  const TPath extends MethodFirstPath<TApiDef>
>(
  apiReg: ApiHandlersRegistry<TApiDef, "">,
  path: TPath,
  handler: HttpMethodEndpointHandler<ExtractEndpointFromPath<TApiDef, TPath>, ExtractTypedParamsFromMethodFirstPath<TPath>>
) {
  const endpointEntry = route(apiReg, path);
  return registerEntryHandler(endpointEntry as any, handler as any);
}

export function registerEntryHandler<
  const TDef extends IHttpMethodEndpointDefinition & ValidateHttpMethodEndpointDefinition<TDef>,
  TPathParams extends string
>(
  endpointEntry: MethodEndpointHandlerRegistryEntry<TDef, TPathParams>,
  handler: HttpMethodEndpointHandler<TDef, TPathParams>
) {
  endpointEntry.register(handler);
}
  
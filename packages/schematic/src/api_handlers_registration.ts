import { IApiContractDefinition, ValidateApiContractDefinition } from "./api_contract.js";
import { ApiHandlersRegistry, MethodEndpointHandlerRegistryEntry } from "./api_handlers_registry.js";
import { ExtractEndpointFromPath, MethodFirstPath, route } from "./api_routing.js";
import { IHttpMethodEndpointDefinition, ValidateHttpMethodEndpointDefinition } from "./http_method_endpoint.js";
import { HttpMethodEndpointHandler } from "./http_method_endpoint_handler.js";
import { ExtractTypedParamsFromMethodFirstPath } from "./typed_path_params.js";


// Overload for registerMethodPathHandler

/* // TODO: clean up
export function register<
  const TApiDef extends IApiContractDefinition & ValidateApiContractDefinition<TApiDef>,
  const TPath extends MethodFirstPath<TApiDef>
>(
  apiReg: ApiHandlersRegistry<TApiDef, "">,
  path: TPath,
  handler: HttpMethodEndpointHandler<ExtractEndpointFromPath<TApiDef, TPath>, ExtractTypedParamsFromMethodFirstPath<TPath>>
): void;

// Overload for registerMethodPathHandler with partial api definition
*/

export function register<
  const TApiDef extends IApiContractDefinition & ValidateApiContractDefinition<TApiDef>,
  TPathParams extends string,
  const TPath extends MethodFirstPath<TApiDef>
>(
  apiReg: ApiHandlersRegistry<TApiDef, TPathParams>,
  path: TPath,
  handler: HttpMethodEndpointHandler<ExtractEndpointFromPath<TApiDef, TPath>, `${TPathParams}${ExtractTypedParamsFromMethodFirstPath<TPath>}`>
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
export function register<
  const TApiDef extends IApiContractDefinition & ValidateApiContractDefinition<TApiDef>,
  const TPath extends MethodFirstPath<TApiDef>,
  const TDef extends IHttpMethodEndpointDefinition & ValidateHttpMethodEndpointDefinition<TDef>,
  TPathParams extends string
>(
  apiRegOrEndpoint: ApiHandlersRegistry<TApiDef, ""> | MethodEndpointHandlerRegistryEntry<TDef, TPathParams>,
  pathOrHandler: TPath | HttpMethodEndpointHandler<TDef, TPathParams>,
  handler?: HttpMethodEndpointHandler<ExtractEndpointFromPath<TApiDef, TPath>, ExtractTypedParamsFromMethodFirstPath<TPath>>
): void {
  if (arguments.length === 3 && handler !== undefined) {
    registerMethodPathHandler(
      apiRegOrEndpoint as ApiHandlersRegistry<TApiDef, "">,
      pathOrHandler as TPath,
      handler
    );
  } else if (arguments.length === 2) {
    registerEntryHandler(
      apiRegOrEndpoint as MethodEndpointHandlerRegistryEntry<TDef, TPathParams>,
      pathOrHandler as HttpMethodEndpointHandler<TDef, TPathParams>
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
  return registerEntryHandler(endpointEntry, handler);
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
  
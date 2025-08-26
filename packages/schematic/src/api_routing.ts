import { IApiContractDefinition, ValidateApiContractDefinition } from "./api_contract.js";
import { ApiHandlersRegistry, MethodEndpointHandlerRegistryEntry } from "./api_handlers_registry.js";
import { HttpMethodEndpoint } from "./http_method_endpoint.js";
import { HttpMethod } from "./http_method_type.js";
import { ExtractTypedParamsFromMethodFirstPath } from "./typed_path_params.js";

/* // TODO: clean up
export function route<
  TApiDef extends IApiContractDefinition & ValidateApiContractDefinition<TApiDef>,
  const TPath extends MethodFirstPath<TApiDef>
>(
  apiReg: ApiHandlersRegistry<TApiDef, "">,
  path: TPath
): MethodEndpointHandlerRegistryEntry<ExtractEndpointFromPath<TApiDef, TPath>, ExtractTypedParamsFromMethodFirstPath<TPath>>;

export function route<
  TApiDef extends IApiContractDefinition & ValidateApiContractDefinition<TApiDef>,
  TPathParams extends string,
  const TPath extends MethodFirstPath<TApiDef>
>(
  apiReg: ApiHandlersRegistry<TApiDef, TPathParams>,
  path: TPath
): MethodEndpointHandlerRegistryEntry<ExtractEndpointFromPath<TApiDef, TPath>, `${TPathParams}${ExtractTypedParamsFromMethodFirstPath<TPath>}`>;
*/

export function route<
  TApiDef extends IApiContractDefinition & ValidateApiContractDefinition<TApiDef>,
  TPathParams extends string,
  const TPath extends MethodFirstPath<TApiDef>
>(
  apiReg: ApiHandlersRegistry<TApiDef, TPathParams>,
  path: TPath
): MethodEndpointHandlerRegistryEntry<ExtractEndpointFromPath<TApiDef, TPath>, `${TPathParams}${ExtractTypedParamsFromMethodFirstPath<TPath>}`, {}> {
  const pathStr = path as string;
  const spaceIndex = pathStr.indexOf(' ');
  if (spaceIndex === -1) {
    throw new Error(`Invalid path format: ${pathStr}. Expected format: "HTTP_METHOD /path"`);
  }
  const method = pathStr.substring(0, spaceIndex) as HttpMethod;
  const urlPath = pathStr.substring(spaceIndex + 1);
  const pathSegments = urlPath.split('/').filter((segment: string) => segment.length > 0);
  return routeByPathSegments(apiReg, pathSegments, method) as any;
}

export function routeByPathSegments<
  TDef extends IApiContractDefinition & ValidateApiContractDefinition<TDef>,
  TPathParams extends string
>(
  registry: ApiHandlersRegistry<TDef, TPathParams>,
  pathSegments: readonly string[],
  method: HttpMethod
): unknown {
  let current: any = registry;
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
  current = current[method];
  return current;
}

export type MethodFirstPath<TDef, BasePath extends string = ""> = {
  [K in keyof TDef & string]:
    TDef[K] extends HttpMethodEndpoint<infer _TEndpointDef>
      ? `${K} ${BasePath}`
      : TDef[K] extends object
        ? MethodFirstPath<TDef[K], `${BasePath}/${K}`>
        : never
}[keyof TDef & string];

export type ExtractEndpointFromPath<
  TApiDef,
  TPath extends string
> = TPath extends `${infer Method} ${infer Path}`
  ? ExtractEndpointFromPathSegments<TApiDef, Path, Method>
  : never;

type ExtractEndpointFromPathSegments<
  TDef,
  TPath extends string,
  TMethod extends string,
  TSegments extends readonly string[] = SplitPath<TPath>
> = NavigateToEndpoint<TDef, TSegments> extends infer TEndpointContainer
  ? TEndpointContainer extends Record<string, any>
    ? TMethod extends keyof TEndpointContainer
      ? TEndpointContainer[TMethod] extends HttpMethodEndpoint<infer TEndpointDef>
        ? TEndpointDef
        : never
      : never
    : never
  : never;

type SplitPath<TPath extends string> = TPath extends `/${infer Rest}`
  ? SplitPathSegments<Rest>
  : SplitPathSegments<TPath>;

type SplitPathSegments<TPath extends string> = TPath extends `${infer First}/${infer Rest}`
  ? [First, ...SplitPathSegments<Rest>]
  : TPath extends ""
  ? []
  : [TPath];

type NavigateToEndpoint<TDef, TSegments extends readonly string[]> = TSegments extends readonly [
  infer First extends string,
  ...infer Rest extends readonly string[]
]
  ? First extends keyof TDef
    ? NavigateToEndpoint<TDef[First], Rest>
    : never
  : TDef;
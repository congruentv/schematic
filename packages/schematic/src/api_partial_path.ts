import { IApiContractDefinition, ValidateApiContractDefinition } from "./api_contract.js";
import { ApiHandlersRegistry } from "./api_handlers_registry.js";
import { HttpMethodEndpoint } from "./http_method_endpoint.js";

export function partialPathString<
  TApiDef extends IApiContractDefinition & ValidateApiContractDefinition<TApiDef>,
  const TPath extends PartialPath<TApiDef>
>(
  _apiReg: ApiHandlersRegistry<TApiDef, "">,
  path: TPath
): string {
  return path as string;
}

export function partialPath<
  TApiDef extends IApiContractDefinition & ValidateApiContractDefinition<TApiDef>,
  const TPath extends PartialPath<TApiDef>
>(
  _apiReg: ApiHandlersRegistry<TApiDef, "">,
  path: TPath
): PartialPathResult<TApiDef, TPath> extends infer TPartialApi
  ? TPartialApi extends IApiContractDefinition & ValidateApiContractDefinition<TPartialApi>
    ? ApiHandlersRegistry<TPartialApi, ExtractPathParamsFromPath<TPath>>
    : never
  : never {
  return path as any;
}

type ExtractPathParamsFromPath<TPath extends string> = 
  TPath extends `/${infer Segment}/${infer Rest}` 
    ? Segment extends `:${infer ParamName}`
      ? `:${ParamName}${ExtractPathParamsFromPath<`/${Rest}`> extends `:${infer RestParams}` ? `:${RestParams}` : ""}`
      : ExtractPathParamsFromPath<`/${Rest}`>
    : TPath extends `/${infer Segment}`
      ? Segment extends `:${infer ParamName}`
        ? `:${ParamName}`
        : ""
    : "";

type PartialPath<TDef, BasePath extends string = ""> = {
  [K in keyof TDef & string]:
    TDef[K] extends HttpMethodEndpoint<infer _TEndpointDef>
      ? never
      : TDef[K] extends object
        ? `${BasePath}/${K}` | PartialPath<TDef[K], `${BasePath}/${K}`>
        : never
}[keyof TDef & string];

export type PartialPathResult<
  TApiDef extends IApiContractDefinition,
  TPath extends string
> = TPath extends `/${infer Rest}`
  ? NavigateToPartialPath<TApiDef, SplitPath<Rest>>
  : NavigateToPartialPath<TApiDef, SplitPath<TPath>>;

type SplitPath<TPath extends string> = TPath extends `${infer First}/${infer Rest}`
  ? [First, ...SplitPath<Rest>]
  : TPath extends ""
    ? []
    : [TPath];

type NavigateToPartialPath<TDef, TSegments extends readonly string[]> = TSegments extends readonly [
  infer First extends string,
  ...infer Rest extends readonly string[]
]
  ? First extends keyof TDef
    ? Rest extends readonly []
      ? TDef[First] extends object
        ? TDef[First]
        : never
      : NavigateToPartialPath<TDef[First], Rest>
    : never
  : TDef;
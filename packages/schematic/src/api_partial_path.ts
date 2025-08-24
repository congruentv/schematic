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
): PartialPathResult<TApiDef, TPath> {
  return path as PartialPathResult<TApiDef, TPath>;
}

export type PartialPath<TDef, BasePath extends string = ""> = {
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
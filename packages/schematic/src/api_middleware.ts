import { z } from "zod";
import { IApiContractDefinition, ValidateApiContractDefinition } from "./api_contract.js";
import { ApiHandlersRegistry } from "./api_handlers_registry.js";
import { DIContainer } from "./di_container.js";
import { HttpMethodEndpoint } from "./http_method_endpoint.js";
import { ExtractConcatenatedParamNamesFromPath, TypedPathParams } from "./typed_path_params.js";
import { HttpMethod } from "./http_method_type.js";

export type MiddlewareHandlerInputSchemas = {
  query?: z.ZodType,
  body?: z.ZodType
};

export type MiddlewareHandlerInput<
  TPathParams extends string,
  InputSchemas extends MiddlewareHandlerInputSchemas
> = {
  method: HttpMethod;
  pathSegments: readonly string[];
  path: string;
  genericPath: string;
  headers: Record<string, string>;
  pathParams: TypedPathParams<TPathParams>;
  query: InputSchemas['query'] extends z.ZodType ? z.output<InputSchemas['query']> : null; // z.output because the handler receives the parsed input
  body: InputSchemas['body'] extends z.ZodType ? z.output<InputSchemas['body']> : null; // z.output because the handler receives the parsed input
};

export type MiddlewareHandler<
  TPathParams extends string,
  InputSchemas extends MiddlewareHandlerInputSchemas
> = (
  input: MiddlewareHandlerInput<TPathParams, InputSchemas>,
  next: () => void
) => void;

export function middleware<
  TApiDef extends IApiContractDefinition & ValidateApiContractDefinition<TApiDef>,
  TDIContainer extends DIContainer,
  TPathParams extends string,
  const TPath extends MiddlewarePath<TApiDef>
>(
  apiReg: ApiHandlersRegistry<TApiDef, TDIContainer, TPathParams>,
  path: TPath
): MiddlewareHandlersRegistryEntry<TApiDef, TDIContainer, TPathParams, TPath> {
  const reg = apiReg._middlewareRegistry as MiddlewareHandlersRegistry<TDIContainer>; // typescript is confused because of type MiddlewareHandlersRegistry<...> | MethodEndpointHandlerRegistryEntry<...>
  const entry = new MiddlewareHandlersRegistryEntry<TApiDef, TDIContainer, TPathParams, TPath>(
    reg, path
  );
  return entry;
}

export type MiddlewarePath<TDef, BasePath extends string = ""> =
  | (BasePath extends "" ? "" : never)
  | {
      [K in keyof TDef & string]:
        TDef[K] extends HttpMethodEndpoint<infer _TEndpointDef>
          ? `${K} ${BasePath}`
          : TDef[K] extends object
            ? `${BasePath}/${K}` | MiddlewarePath<TDef[K], `${BasePath}/${K}`>
            : never
    }[keyof TDef & string];

export class MiddlewareHandlersRegistryEntry<
  TApiDef extends IApiContractDefinition & ValidateApiContractDefinition<TApiDef>,
  TDIContainer extends DIContainer,
  TPathParams extends string,
  const TPath extends MiddlewarePath<TApiDef>
>{
  private readonly _registry: MiddlewareHandlersRegistry<TDIContainer>;
  constructor(
    registry: MiddlewareHandlersRegistry<TDIContainer>,
    _path: TPath
  ) {
    this._registry = registry;
  }

  register<const InputSchemas extends MiddlewareHandlerInputSchemas>(
    _inputSchemas: InputSchemas,
    _handler: MiddlewareHandler<`${TPathParams}${ExtractConcatenatedParamNamesFromPath<TPath>}`, InputSchemas>
  ) {
    (this._registry._dicontainer as TDIContainer).createScope();
  }
}

export class MiddlewareHandlersRegistry<TDIContainer extends DIContainer> {
  _dicontainer: unknown; 
  // can't use :TDIContainer type
  // Type instantiation is excessively deep and possibly infinite.ts(2589)

  constructor(
    dicontainer: TDIContainer
  ) {
    this._dicontainer = dicontainer;
  }
}
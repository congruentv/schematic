import { z } from "zod";
import { IApiContractDefinition, ValidateApiContractDefinition } from "./api_contract.js";
import { ApiHandlersRegistry } from "./api_handlers_registry.js";
import { DIContainer } from "./di_container.js";
import { HttpMethodEndpoint } from "./http_method_endpoint.js";
import { ExtractConcatenatedParamNamesFromPath, TypedPathParams } from "./typed_path_params.js";
import { HttpMethod } from "./http_method_type.js";

export type MiddlewareHandlerInputSchemas = {
  headers?: z.ZodType,
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
  headers: InputSchemas['headers'] extends z.ZodType ? z.output<InputSchemas['headers']> : Record<string, string>; // z.output because the handler receives the parsed input
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
> {
  private readonly _registry: MiddlewareHandlersRegistry<TDIContainer>;
  private readonly _path: TPath;
  constructor(
    registry: MiddlewareHandlersRegistry<TDIContainer>,
    _path: TPath
  ) {
    this._registry = registry;
    this._path = _path;
  }

  register<const InputSchemas extends MiddlewareHandlerInputSchemas>(
    _inputSchemas: InputSchemas,
    _handler: MiddlewareHandler<`${TPathParams}${ExtractConcatenatedParamNamesFromPath<TPath>}`, InputSchemas>
  ) {
    this._registry.register(this._path, _handler);
    //(this._registry._dicontainer as TDIContainer).createScope();
  }
}

export type MiddlewareGenericHandler = (req: any, next: () => void) => void;

export type OnMiddlewareHandlerRegisteredCallback = (middlewarePath: string, handler: MiddlewareGenericHandler) => void;

export class MiddlewareHandlersRegistry<TDIContainer extends DIContainer> {
  private _dicontainer: unknown; 
  // can't use :TDIContainer type
  // Type instantiation is excessively deep and possibly infinite.ts(2589)
  constructor(
    dicontainer: TDIContainer,
    callback: OnMiddlewareHandlerRegisteredCallback
  ) {
    this._dicontainer = dicontainer;
    this._onHandlerRegisteredCallback = callback;
  }

  register(middlewarePath: string, handler: MiddlewareGenericHandler) {
    // const { method, pathSegments } = this._splitFullPath(middlewarePath);
    if (this._onHandlerRegisteredCallback) {
      this._onHandlerRegisteredCallback(middlewarePath, handler);
    }
  }

  // TODO
  trigger() {
    (this._dicontainer as TDIContainer).createScope();
  }

  private _onHandlerRegisteredCallback: OnMiddlewareHandlerRegisteredCallback | null = null;
  _onHandlerRegistered(callback: OnMiddlewareHandlerRegisteredCallback): void {
    this._onHandlerRegisteredCallback = callback;
  }

  // private _splitFullPath(middlewarePath: string): { method: string; pathSegments: string[] } {
  //   const splitResult = middlewarePath.split(" ");
  //   let method: string = '';
  //   let pathSegments: string[] = [];
  //   if (splitResult.length === 2) {
  //     method = splitResult[0].trim();
  //     if (method === '') {
  //       throw new Error(`Invalid middleware path format: "${middlewarePath}". HTTP method is empty.`);
  //     }
  //     pathSegments = splitResult[1]
  //       .split("/")
  //       .map(segment => segment.trim())
  //       .filter(segment => segment !== '');
  //   }
  //   return {
  //     method,
  //     pathSegments
  //   };
  // }
}
import { Express } from 'express';
import { 
  HttpMethodEndpointHandler,
  MethodEndpointHandlerRegistryEntry, 
  IHttpMethodEndpointDefinition,
  type LowerCasedHttpMethod,
  ValidateHttpMethodEndpointDefinition,
  route,
  MethodFirstPath,
  ExtractEndpointFromPath,
  ExtractTypedParamsFromMethodFirstPath,
  ApiHandlersRegistry,
  IApiContractDefinition,
  ValidateApiContractDefinition
} from '@congruentv/schematic';

// Overload for registerMethodPathHandler
export function register<
  const TApiDef extends IApiContractDefinition & ValidateApiContractDefinition<TApiDef>,
  const TPath extends MethodFirstPath<TApiDef>
>(
  app: Express, 
  apiReg: ApiHandlersRegistry<TApiDef, "">,
  path: TPath,
  handler: HttpMethodEndpointHandler<ExtractEndpointFromPath<TApiDef, TPath>, ExtractTypedParamsFromMethodFirstPath<TPath>>
): void;

// Overload for registerEntryHandler
export function register<
  const TDef extends IHttpMethodEndpointDefinition & ValidateHttpMethodEndpointDefinition<TDef>,
  TPathParams extends string
>(
  app: Express, 
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
  app: Express,
  apiRegOrEndpoint: ApiHandlersRegistry<TApiDef, ""> | MethodEndpointHandlerRegistryEntry<TDef, TPathParams>,
  pathOrHandler: TPath | HttpMethodEndpointHandler<TDef, TPathParams>,
  handler?: HttpMethodEndpointHandler<ExtractEndpointFromPath<TApiDef, TPath>, ExtractTypedParamsFromMethodFirstPath<TPath>>
): void {
  if (arguments.length === 4 && handler !== undefined) {
    registerMethodPathHandler(
      app,
      apiRegOrEndpoint as ApiHandlersRegistry<TApiDef, "">,
      pathOrHandler as TPath,
      handler
    );
  } else if (arguments.length === 3) {
    registerEntryHandler(
      app,
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
  app: Express, 
  apiReg: ApiHandlersRegistry<TApiDef, "">,
  path: TPath,
  handler: HttpMethodEndpointHandler<ExtractEndpointFromPath<TApiDef, TPath>, ExtractTypedParamsFromMethodFirstPath<TPath>>
) {
  const endpointEntry = route(apiReg, path);
  return registerEntryHandler(app, endpointEntry, handler);
}

export function registerEntryHandler<
  const TDef extends IHttpMethodEndpointDefinition & ValidateHttpMethodEndpointDefinition<TDef>,
  TPathParams extends string
>(
  app: Express, 
  endpointEntry: MethodEndpointHandlerRegistryEntry<TDef, TPathParams>,
  handler: HttpMethodEndpointHandler<TDef, TPathParams>
) {
  endpointEntry.handle(handler);
  const { genericPath } = endpointEntry.methodEndpoint;
  const method = endpointEntry.methodEndpoint.method.toLowerCase() as LowerCasedHttpMethod;
  app[method](genericPath, async (req, res) => {
    const pathParams = req.params;
    const query = req.query;
    const body = req.body;
    const headers = JSON.parse(JSON.stringify(req.headers)); // TODO
    const result = await endpointEntry.trigger({
      headers,
      pathParams,
      query,
      body,
    });
    res.status(result.code).json(result.body);
  });
}
  
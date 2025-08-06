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
  ExtractPathParamsFromPath,
  ApiHandlersRegistry,
  IApiContractDefinition,
  ValidateApiContractDefinition
} from '@congruentv/schematic';

export function registerByPath<
  const TApiDef extends IApiContractDefinition & ValidateApiContractDefinition<TApiDef>,
  const TPath extends MethodFirstPath<TApiDef>
>(
  app: Express, 
  apiReg: ApiHandlersRegistry<TApiDef, "">,
  path: TPath,
  handler: HttpMethodEndpointHandler<ExtractEndpointFromPath<TApiDef, TPath>, ExtractPathParamsFromPath<TPath>>
) {
  const endpointEntry = route(apiReg, path);
  return register(app, endpointEntry, handler);
}

export function register<
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
    const headers = JSON.parse(JSON.stringify(req.headers)); // Convert headers to a plain object
    const result = await endpointEntry.trigger({
      headers,
      pathParams,
      query,
      body,
    });
    res.status(result.code).json(result.body);
  });
}
  
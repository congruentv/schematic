import { Express } from 'express';
import { 
  HttpMethodEndpointHandler,
  MethodEndpointHandlerRegistryEntry, 
  IHttpMethodEndpointDefinition,
  type LowerCasedHttpMethod
} from '@congruentv/schematic';

export function register<const TDef extends IHttpMethodEndpointDefinition>(
  app: Express, 
  endpointEntry: MethodEndpointHandlerRegistryEntry<TDef>,
  handler: HttpMethodEndpointHandler<TDef>
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
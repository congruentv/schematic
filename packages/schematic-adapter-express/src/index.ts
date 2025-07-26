import { Express } from 'express';
import { 
  MethodEndpointHandler,
  MethodEndpointHandlerContainer, 
  IMethodEndpointDefinition,
  type LowerCasedMethod
} from '@congruentv/schematic';

export function configureEndpoint<const TDef extends IMethodEndpointDefinition>(
  app: Express, 
  endpointContainer: MethodEndpointHandlerContainer<TDef>,
  handler: MethodEndpointHandler<TDef>
) {
  endpointContainer.handle(handler);
  const { genericPath } = endpointContainer.methodEndpoint;
  const method = endpointContainer.methodEndpoint.method.toLowerCase() as LowerCasedMethod;
  app[method](genericPath, async (req, res) => {
    const pathParams = req.params;
    const query = req.query;
    const body = req.body;
    const headers = JSON.parse(JSON.stringify(req.headers)); // Convert headers to a plain object
    const result = await endpointContainer.trigger({
      headers,
      pathParams,
      query,
      body,
    });
    res.status(result.code).json(result.payload);
  });
}
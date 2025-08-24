import { 
  Express,
  RequestHandler, 
  // Router // TODO
} from 'express';

import {
  type LowerCasedHttpMethod,
  IApiContractDefinition,
  ValidateApiContractDefinition,
  createRegistry,
  ApiContract,
  PrepareRegistryEntryCallback,
  IHttpMethodEndpointDefinition,
  ValidateHttpMethodEndpointDefinition
} from '@congruentv/schematic';

export function createExpressRegistry<
  TDef extends IApiContractDefinition & ValidateApiContractDefinition<TDef>
>(
  app: Express,
  apiContract: ApiContract<TDef>
) {
  const registry = createRegistry<TDef>(apiContract, (entry) => {
    const { genericPath } = entry.methodEndpoint;
    const method = entry.methodEndpoint.method.toLowerCase() as LowerCasedHttpMethod;
    app[method](genericPath, async (req, res) => {
      const pathParams = req.params;
      const query = req.query;
      const body = req.body;
      const headers = JSON.parse(JSON.stringify(req.headers)); // TODO
      const result = await entry.trigger({
        headers,
        pathParams,
        query,
        body,
      });
      res.status(result.code).json(result.body);
    });
  });
  return registry;
}

export function expressPrehandler<
  TDef extends IHttpMethodEndpointDefinition & ValidateHttpMethodEndpointDefinition<TDef>,
  TPathParams extends string
> (
  app: Express,
  prehandler: RequestHandler
): PrepareRegistryEntryCallback<TDef, TPathParams> {
  return (({ methodEndpoint: { lowerCasedMethod, genericPath }}) => {
    app[lowerCasedMethod](genericPath, prehandler);
  });
}
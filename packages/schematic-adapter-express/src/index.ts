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
  ValidateHttpMethodEndpointDefinition,
  DIContainer
} from '@congruentv/schematic';

export function createExpressRegistry<
  TDef extends IApiContractDefinition & ValidateApiContractDefinition<TDef>,
  TDIContainer extends DIContainer
>(
  app: Express,
  diContainer: TDIContainer,
  apiContract: ApiContract<TDef>
) {
  const registry = createRegistry<TDef, TDIContainer>(diContainer, apiContract, {
    handlerRegisteredCallback: (entry) => {
      console.log('Registering Express route:', entry.methodEndpoint.genericPath);
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
    },
    middlewareHandlerRegisteredCallback: (middlewarePath, handler) => {
      console.log('Registering Express middleware:', middlewarePath);
      app.use(middlewarePath, (req, _res, next) => {
        const pathParams = req.params;
        const query = req.query;
        const body = req.body;
        const headers = JSON.parse(JSON.stringify(req.headers)); // TODO
        handler({
          headers,
          pathParams,
          query,
          body,
        }, next);
      });
    }
  });
  return registry;
}

export function expressPreHandler<
  TDef extends IHttpMethodEndpointDefinition & ValidateHttpMethodEndpointDefinition<TDef>,
  TDIContainer extends DIContainer,
  TPathParams extends string
> (
  app: Express,
  prehandler: RequestHandler
): PrepareRegistryEntryCallback<TDef, TDIContainer, TPathParams> {
  return (({ methodEndpoint: { lowerCasedMethod, genericPath }}) => {
    app[lowerCasedMethod](genericPath, prehandler);
  });
}
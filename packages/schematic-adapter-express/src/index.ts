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
        // @ts-ignore
        req.pathParams = req.params;
        const result = await entry.trigger(req as any);
        res.status(result.code).json(result.body);
      });
    },
    middlewareHandlerRegisteredCallback: (middlewarePath, handler) => {
      console.log('Registering Express middleware:', middlewarePath);
      app.use(middlewarePath, (req, _res, next) => {
        // @ts-ignore
        req.pathParams = req.params;
        handler(req, next);
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
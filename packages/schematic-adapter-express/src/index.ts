import { Express } from 'express';
import {
  type LowerCasedHttpMethod,
  IApiContractDefinition,
  ValidateApiContractDefinition,
  createRegistry,
  ApiContract
} from '@congruentv/schematic';

// TODO: express allows additional middleware to be passed, but this is not implemented here
// - app.use('/foo', ...) will trigger for all methods (GET, POST, etc.) for routes that start with /foo
//   - you may check that req.method is GET inside the middleware
// - while passing a middleware function to app.get('/foo', ...) will only trigger for GET requests to /foo
//
// e.g.
// app.get('/foo', (req, res, next) => {
//   console.log('/foo endpoint hit');
//   // ... autherization logic here ...
//   next();
//   console.log('/foo endpoint finished');
// }, (req, res) => {
//   res.status(200).send('Welcome to the Pokemon API!');
// });

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
  
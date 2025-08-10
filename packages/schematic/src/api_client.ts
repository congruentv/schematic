import { ApiContract, IApiContractDefinition, ValidateApiContractDefinition } from "./api_contract.js";
import { HttpMethodCallFunc,  } from './api_client_http_method_call.js';
import { HttpMethodEndpoint } from './http_method_endpoint.js';
import { ClientHttpMethodEndpointHandler } from "./http_method_endpoint_handler.js";

export function createClient<
  TDef extends IApiContractDefinition & ValidateApiContractDefinition<TDef>
> (
  contract: ApiContract<TDef>, 
  clientGenericHandler: ClientHttpMethodEndpointHandler
) {
  const apiClient = new ApiClient(contract, clientGenericHandler);
  return apiClient;
}

export type PathParamFunc<TDef> = (value: string | number) => TDef;

export interface IClientContext {
  pathParameters: Record<string, string>;
}

class InnerApiClient<TDef extends IApiContractDefinition & ValidateApiContractDefinition<TDef>> {

  // TODO: if making __CONTEXT__ private member, the following compilation error occurs: 
  // "Property '__CONTEXT__' of exported anonymous class type may not be private or protected.ts(4094)"
  // Reason: exported anonymous classes can't have private or protected members if declaration emit is enabled
  // Source: https://stackoverflow.com/questions/55242196/typescript-allows-to-use-proper-multiple-inheritance-with-mixins-but-fails-to-c
  
  /** @internal */
  __CONTEXT__: IClientContext;

  constructor(contract: ApiContract<TDef>, clientGenericHandler: ClientHttpMethodEndpointHandler) {
    const clonedDefinition = contract._cloneDefinition();

    const proto = { ...InnerApiClient.prototype };
    Object.assign(proto, Object.getPrototypeOf(clonedDefinition));
    Object.setPrototypeOf(this, proto);
    Object.assign(this, clonedDefinition);

    InnerApiClient._implement(this, this, clientGenericHandler);

    this.__CONTEXT__ = InnerApiClient._initNewContext();
  }

  private static _initNewContext(): IClientContext {
    return {
      pathParameters: {},
    };
  }

  private static _implement<TDef extends IApiContractDefinition & ValidateApiContractDefinition<TDef>>(
    client: InnerApiClient<TDef>,
    currObj: any, 
    clientGenericHandler: ClientHttpMethodEndpointHandler
  ): void {
    for (const key of Object.keys(currObj)) {
      if (key === '__CONTEXT__') {
        continue; // skip the context property
      }
      const val = currObj[key];
      if (key.startsWith(':')) {
        const paramName = key.slice(1);
        currObj[paramName] = ((value: string | number) => {
          client.__CONTEXT__.pathParameters[paramName] = value.toString();
          return val;
        });
        delete currObj[key];
        InnerApiClient._implement(client, val, clientGenericHandler);
      } else if (val instanceof HttpMethodEndpoint) {
        currObj[key] = (req: never | { headers: Record<string, string>; query: Record<string, any>; body: any }) => {
          const pathParams = { ...client.__CONTEXT__.pathParameters };
          
          // Clear & reinitialize client context right before making the call
          client.__CONTEXT__ = InnerApiClient._initNewContext(); 

          if (val.definition.headers) {
            if (
              !('headers' in req)
              || req.headers === null
              || req.headers === undefined
            ) {
              throw new Error('Headers are required for this endpoint');
            }
            const result = val.definition.headers.safeParse(req.headers);
            if (!result.success) {
              throw result.error;
            }
          }

          if (val.definition.query) {
            if (
              !('query' in req)
              || req.query === null
              || req.query === undefined
            ) {
              throw new Error('Query is required for this endpoint');
            }
            const result = val.definition.query.safeParse(req.query);
            if (!result.success) {
              throw result.error;
            }
          }

          if (val.definition.body) {
            if (
              !('body' in req)
              || req.body === null
              || req.body === undefined
            ) {
              throw new Error('Body is required for this endpoint');
            }
            const result = val.definition.body.safeParse(req.body);
            if (!result.success) {
              throw result.error;
            }
          }

          const path = `/${val.pathSegments.map(segment => 
              segment.startsWith(':') 
              ? (pathParams[segment.slice(1)] ?? '?') 
              : segment
            ).join('/')}`;
          return clientGenericHandler({
            method: val.method,
            pathSegments: val.pathSegments,
            genericPath: val.genericPath,
            path,
            headers: req?.headers ?? null,
            pathParams,
            query: req?.query ?? null,
            body: req?.body ?? null,
          });
        };
      } else if (typeof val === 'object' && val !== null) {
        InnerApiClient._implement(client, val, clientGenericHandler);
      }
    }
  }
}

export type ApiClientDef<ObjType extends object> = {
  [Key in keyof ObjType as Key extends `:${infer Param}` ? Param : Key]:
    Key extends `:${string}`
      ? ObjType[Key] extends object
        ? PathParamFunc<ApiClientDef<ObjType[Key]>>
        : never
      : ObjType[Key] extends HttpMethodEndpoint<infer TMethodEndpointDef>
        ? HttpMethodCallFunc<TMethodEndpointDef>
        : ObjType[Key] extends object
          ? ApiClientDef<ObjType[Key]>
          : ObjType[Key];
};

export type ApiClient<TDef extends IApiContractDefinition & ValidateApiContractDefinition<TDef>> = ApiClientDef<InnerApiClient<TDef> & TDef>;
export const ApiClient: new <TDef extends IApiContractDefinition & ValidateApiContractDefinition<TDef>>(contract: ApiContract<TDef>, clientGenericHandler: ClientHttpMethodEndpointHandler) => ApiClient<TDef> = InnerApiClient as any;
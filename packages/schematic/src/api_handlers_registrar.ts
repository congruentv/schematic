import { ApiContract, IApiContractDefinition } from "./api_contract.js";
import { IHttpMethodEndpointDefinition, HttpMethodEndpoint } from "./http_method_endpoint.js";
import { HttpMethodEndpointHandler } from "./http_method_endpoint_handler.js";
import { HttpMethod } from "./http_method_type.js";

export class MethodEndpointHandlerContainer<TDef extends IHttpMethodEndpointDefinition> {
  private _methodEndpoint: HttpMethodEndpoint<TDef>;
  get methodEndpoint(): HttpMethodEndpoint<TDef> {
    return this._methodEndpoint;
  }

  constructor(methodEndpoint: HttpMethodEndpoint<TDef>) {
    this._methodEndpoint = methodEndpoint;
  }

  private _handler: HttpMethodEndpointHandler<TDef> | null = null;
  handle(handler: HttpMethodEndpointHandler<TDef>): void {
    this._handler = handler;
  }

  async trigger(data: { 
    headers: Record<string, string>,
    pathParams: Record<string, string>,
    query: object,
    body: object,
  }): Promise<any> {
    if (!this._handler) {
      throw new Error('Handler not set for this endpoint');
    }

    if (this._methodEndpoint.definition.query) {
      if (
        !('query' in data)
        || data.query === null
        || data.query === undefined
      ) {
        throw new Error('Query is required for this endpoint');
      }
      const result = this._methodEndpoint.definition.query.safeParse(data.query);
      if (!result.success) {
        throw result.error;
      }
    }

    if (this._methodEndpoint.definition.body) {
      if (
        !('body' in data)
        || data.body === null
        || data.body === undefined
      ) {
        throw new Error('Body is required for this endpoint');
      }
      const result = this._methodEndpoint.definition.body.safeParse(data.body);
      if (!result.success) {
        throw result.error;
      }
    }

    const path = `/${this._methodEndpoint.pathSegments.map(segment => 
      segment.startsWith(':') 
      ? (data.pathParams[segment.slice(1)] ?? '?') 
      : segment
    ).join('/')}`;

    return await this._handler({ 
      method: this._methodEndpoint.method,
      path,
      genericPath: this._methodEndpoint.genericPath,
      pathSegments: this._methodEndpoint.pathSegments,
      headers: data.headers,
      pathParams: data.pathParams, 
      query: data.query as any, 
      body: data.body as any
    });
  }
}

class InnerApiHandlersRegistrar<TDef extends IApiContractDefinition> {
  constructor(contract: ApiContract<TDef>) {
    const clonedDefinition = contract._cloneDefinition();

    const proto = { ...InnerApiHandlersRegistrar.prototype };
    Object.assign(proto, Object.getPrototypeOf(clonedDefinition));
    Object.setPrototypeOf(this, proto);
    Object.assign(this, clonedDefinition);

    InnerApiHandlersRegistrar._implement(this);
  }

  private static _implement(
    currObj: any
  ): void {
    for (const key of Object.keys(currObj)) {
      const value = currObj[key];
      if (value instanceof HttpMethodEndpoint) {
        currObj[key] = new MethodEndpointHandlerContainer(value);
      } else if (typeof value === "object" && value !== null) {
        InnerApiHandlersRegistrar._implement(value);
      }
    }
  }
}

export function routeByPathSegments<TDef extends IApiContractDefinition>(
  registrar: InnerApiHandlersRegistrar<TDef>,
  pathSegments: readonly string[],
  method: HttpMethod
): MethodEndpointHandlerContainer<any> {
  let current: any = registrar;
  for (const segment of pathSegments) {
    if (current[segment] instanceof MethodEndpointHandlerContainer) {
      current = current[segment];
    } else if (typeof current[segment] === 'object') {
      current = current[segment];
    } else {
      throw new Error(`Path segment "${segment}" not found in API handlers registrar`);
    }
  }
  if (!(method in current)) {
    throw new Error(`Method "${method}" not found for path "${pathSegments.join('/')}"`);
  }
  if (!(current[method] instanceof MethodEndpointHandlerContainer)) {
    throw new Error(`Method "${method}" is not a valid endpoint handler for path "${pathSegments.join('/')}"`);
  }
  current = current[method];
  return current;
}

export type ApiHandlersRegistrarDef<ObjType extends object> = {
  [Key in keyof ObjType]: ObjType[Key] extends HttpMethodEndpoint<infer TMethodEndpointDef>
    ? MethodEndpointHandlerContainer<TMethodEndpointDef>
    : ObjType[Key] extends object
      ? ApiHandlersRegistrarDef<ObjType[Key]>
      : ObjType[Key];
}

export type ApiHandlersRegistrar<TDef extends IApiContractDefinition> = ApiHandlersRegistrarDef<InnerApiHandlersRegistrar<TDef> & TDef>;
export const ApiHandlersRegistrar: new <TDef extends IApiContractDefinition>(contract: ApiContract<TDef>) => ApiHandlersRegistrar<TDef> = InnerApiHandlersRegistrar as any;
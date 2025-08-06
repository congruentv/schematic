import { ApiContract, IApiContractDefinition, ValidateApiContractDefinition } from "./api_contract.js";
import { IHttpMethodEndpointDefinition, HttpMethodEndpoint, ValidateHttpMethodEndpointDefinition } from "./http_method_endpoint.js";
import { HttpMethodEndpointHandler } from "./http_method_endpoint_handler.js";
import { HttpStatusCode } from "./http_status_code.js";

export function createRegistry<
  TDef extends IApiContractDefinition & ValidateApiContractDefinition<TDef>,
  TPathParams extends string = ':foo'
>(
  contract: ApiContract<TDef>
) {
  return new ApiHandlersRegistry<TDef, TPathParams>(contract);
}

export class MethodEndpointHandlerRegistryEntry<
  TDef extends IHttpMethodEndpointDefinition & ValidateHttpMethodEndpointDefinition<TDef>,
  TPathParams extends string
> {
  private _methodEndpoint: HttpMethodEndpoint<TDef>;
  get methodEndpoint(): HttpMethodEndpoint<TDef> {
    return this._methodEndpoint;
  }

  constructor(methodEndpoint: HttpMethodEndpoint<TDef>) {
    this._methodEndpoint = methodEndpoint;
  }

  private _handler: HttpMethodEndpointHandler<TDef, TPathParams> | null = null;
  handle(handler: HttpMethodEndpointHandler<TDef, TPathParams>): void {
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

    if (this._methodEndpoint.definition.headers) {
      if (
        !('headers' in data)
        || data.headers === null
        || data.headers === undefined
      ) {
        throw new Error('Headers are required for this endpoint');
      }
      const result = this._methodEndpoint.definition.headers.safeParse(data.headers);
      if (!result.success) {
        return { code: HttpStatusCode.BadRequest_400, body: JSON.parse(result.error.message) };
      }
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
        return { code: HttpStatusCode.BadRequest_400, body: JSON.parse(result.error.message) };
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
        return { code: HttpStatusCode.BadRequest_400, body: JSON.parse(result.error.message) };
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
      pathParams: data.pathParams as any, 
      query: data.query as any, 
      body: data.body as any
    });
  }
}

class InnerApiHandlersRegistry<TDef extends IApiContractDefinition & ValidateApiContractDefinition<TDef>> {
  constructor(contract: ApiContract<TDef>) {
    const clonedDefinition = contract._cloneDefinition();

    const proto = { ...InnerApiHandlersRegistry.prototype };
    Object.assign(proto, Object.getPrototypeOf(clonedDefinition));
    Object.setPrototypeOf(this, proto);
    Object.assign(this, clonedDefinition);

    InnerApiHandlersRegistry._implement(this);
  }

  private static _implement(
    currObj: any
  ): void {
    for (const key of Object.keys(currObj)) {
      const value = currObj[key];
      if (value instanceof HttpMethodEndpoint) {
        currObj[key] = new MethodEndpointHandlerRegistryEntry(value);
      } else if (typeof value === "object" && value !== null) {
        InnerApiHandlersRegistry._implement(value);
      }
    }
  }
}

export type ApiHandlersRegistryDef<
  ObjType extends object, 
  TPathParams extends string
> = {
  [Key in keyof ObjType]: Key extends `:${infer ParamName}`
    ? ObjType[Key] extends HttpMethodEndpoint<infer TMethodEndpointDef>
      ? MethodEndpointHandlerRegistryEntry<TMethodEndpointDef, `${TPathParams}:${ParamName}`>
      : ObjType[Key] extends object
        ? ApiHandlersRegistryDef<ObjType[Key], `${TPathParams}:${ParamName}`>
        : ObjType[Key]
    : ObjType[Key] extends HttpMethodEndpoint<infer TMethodEndpointDef>
      ? MethodEndpointHandlerRegistryEntry<TMethodEndpointDef, TPathParams>
      : ObjType[Key] extends object
        ? ApiHandlersRegistryDef<ObjType[Key], TPathParams>
        : ObjType[Key];
}

export type ApiHandlersRegistry<
  TDef extends IApiContractDefinition & ValidateApiContractDefinition<TDef>, 
  TPathParams extends string
> = ApiHandlersRegistryDef<InnerApiHandlersRegistry<TDef> & TDef, TPathParams>;

export const ApiHandlersRegistry: new <
  TDef extends IApiContractDefinition & ValidateApiContractDefinition<TDef>, 
  TPathParams extends string
>(contract: ApiContract<TDef>) => ApiHandlersRegistry<TDef, TPathParams> = InnerApiHandlersRegistry as any;
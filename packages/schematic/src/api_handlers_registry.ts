import { ApiContract, IApiContractDefinition, ValidateApiContractDefinition } from "./api_contract.js";
import { DIContainer } from "./di_container.js";
import { IHttpMethodEndpointDefinition, HttpMethodEndpoint, ValidateHttpMethodEndpointDefinition } from "./http_method_endpoint.js";
import { HttpMethodEndpointHandler } from "./http_method_endpoint_handler.js";
import { HttpStatusCode } from "./http_status_code.js";

export function createRegistry<
  TDef extends IApiContractDefinition & ValidateApiContractDefinition<TDef>,
  TDIContainer extends DIContainer
>(
  diContainer: TDIContainer,
  contract: ApiContract<TDef>,
  callback: GenericOnHandlerRegisteredCallback<TDIContainer>
) {
  return new ApiHandlersRegistry<TDef, TDIContainer>(diContainer, contract, callback);
}

export type PrepareRegistryEntryCallback<
  TDef extends IHttpMethodEndpointDefinition & ValidateHttpMethodEndpointDefinition<TDef>,
  TDIContainer extends DIContainer,
  TPathParams extends string
> = (entry: MethodEndpointHandlerRegistryEntry<TDef, TDIContainer, TPathParams, any>) => void;

export type OnHandlerRegisteredCallback<
  TDef extends IHttpMethodEndpointDefinition & ValidateHttpMethodEndpointDefinition<TDef>,
  TDIContainer extends DIContainer,
  TPathParams extends string
> = (entry: MethodEndpointHandlerRegistryEntry<TDef, TDIContainer, TPathParams, any>) => void;

export type GenericOnHandlerRegisteredCallback<TDIContainer extends DIContainer> = 
  OnHandlerRegisteredCallback<
    IHttpMethodEndpointDefinition & ValidateHttpMethodEndpointDefinition<IHttpMethodEndpointDefinition>, 
    TDIContainer,
    string
  >;

export class MethodEndpointHandlerRegistryEntry<
  TDef extends IHttpMethodEndpointDefinition & ValidateHttpMethodEndpointDefinition<TDef>,
  TDIContainer extends DIContainer,
  TPathParams extends string,
  TInjected = {}
> {
  private _methodEndpoint: HttpMethodEndpoint<TDef>;
  get methodEndpoint(): HttpMethodEndpoint<TDef> {
    return this._methodEndpoint;
  }

  private _dicontainer: TDIContainer;
  get dicontainer(): TDIContainer {
    return this._dicontainer;
  }

  constructor(methodEndpoint: HttpMethodEndpoint<TDef>, dicontainer: TDIContainer) {
    this._methodEndpoint = methodEndpoint;
    this._dicontainer = dicontainer;
  }

  private _handler: HttpMethodEndpointHandler<TDef, TPathParams, TInjected> | null = null;
  register(handler: HttpMethodEndpointHandler<TDef, TPathParams, TInjected>): void {
    this._handler = handler;
    if (this._onHandlerRegisteredCallback) {
      this._onHandlerRegisteredCallback(this);
    }
  }

  private _onHandlerRegisteredCallback: OnHandlerRegisteredCallback<TDef, TDIContainer, TPathParams> | null = null;
  _onHandlerRegistered(callback: OnHandlerRegisteredCallback<TDef, TDIContainer, TPathParams>): void {
    this._onHandlerRegisteredCallback = callback;
  }

  prepare(callback: PrepareRegistryEntryCallback<TDef, TDIContainer, TPathParams>) {
    callback(this);
    return this;
  }

  private _injection: any = null;
  inject<TNewInjected>(injection: (dicontainer: TDIContainer) => TNewInjected): MethodEndpointHandlerRegistryEntry<TDef, TDIContainer, TPathParams, TNewInjected> {
    this._injection = injection;
    return this as unknown as MethodEndpointHandlerRegistryEntry<TDef, TDIContainer, TPathParams, TNewInjected>;
  }

  async trigger(
    data: { 
      headers: Record<string, string>,
      pathParams: Record<string, string>,
      query: object,
      body: object,
    }
  ): Promise<any> {
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
        throw new Error(`Body is required for this endpoint, { 'Content-Type': 'application/json' } header might be missing`);
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
      body: data.body as any,
      injected: this._injection(this._dicontainer.createScope()) as any,
    });
  }
}

class InnerApiHandlersRegistry<
  TDef extends IApiContractDefinition & ValidateApiContractDefinition<TDef>,
  TDIContainer extends DIContainer
> {
  // public readonly dicontainer: TDIContainer;
  constructor(
    dicontainer: TDIContainer,
    contract: ApiContract<TDef>, 
    callback: GenericOnHandlerRegisteredCallback<TDIContainer>
  ) {
    const initializedDefinition = contract.cloneInitDef();
    const proto = { ...InnerApiHandlersRegistry.prototype };
    Object.assign(proto, Object.getPrototypeOf(initializedDefinition));
    Object.setPrototypeOf(this, proto);
    Object.assign(this, initializedDefinition);
    InnerApiHandlersRegistry._initialize(this, callback, dicontainer);
    // this.dicontainer = dicontainer;
  }

  private static _initialize<TDIContainer extends DIContainer>(
    currObj: any,
    callback: GenericOnHandlerRegisteredCallback<TDIContainer>,
    dicontainer: TDIContainer
  ): void {
    for (const key of Object.keys(currObj)) {
      if (key === 'dicontainer') {
        continue;
      }
      const value = currObj[key];
      if (value instanceof HttpMethodEndpoint) {
        const entry = new MethodEndpointHandlerRegistryEntry(value, dicontainer);
        entry._onHandlerRegistered(callback);
        currObj[key] = entry;
      } else if (typeof value === "object" && value !== null) {
        InnerApiHandlersRegistry._initialize(value, callback, dicontainer);
      }
    }
  }
}

export type ApiHandlersRegistryDef<
  ObjType extends object, 
  TDIContainer extends DIContainer,
  TPathParams extends string
> = {
  [Key in keyof ObjType]: Key extends `:${infer ParamName}`
    ? ObjType[Key] extends HttpMethodEndpoint<infer TMethodEndpointDef>
      ? MethodEndpointHandlerRegistryEntry<TMethodEndpointDef, TDIContainer, `${TPathParams}:${ParamName}`>
      : ObjType[Key] extends object
        ? ApiHandlersRegistryDef<ObjType[Key], TDIContainer, `${TPathParams}:${ParamName}`>
        : ObjType[Key]
    : ObjType[Key] extends HttpMethodEndpoint<infer TMethodEndpointDef>
      ? MethodEndpointHandlerRegistryEntry<TMethodEndpointDef, TDIContainer, TPathParams>
      : ObjType[Key] extends object
        ? ApiHandlersRegistryDef<ObjType[Key], TDIContainer, TPathParams>
        : ObjType[Key];
}

export type ApiHandlersRegistry<
  TDef extends IApiContractDefinition & ValidateApiContractDefinition<TDef>, 
  TDIContainer extends DIContainer,
  TPathParams extends string = "",
> = ApiHandlersRegistryDef<InnerApiHandlersRegistry<TDef, TDIContainer> & TDef, TDIContainer, TPathParams>;

export const ApiHandlersRegistry: new <
  TDef extends IApiContractDefinition & ValidateApiContractDefinition<TDef>, 
  TDIContainer extends DIContainer,
  TPathParams extends string = ""
>(
  dicontainer: TDIContainer,
  contract: ApiContract<TDef>, 
  callback: GenericOnHandlerRegisteredCallback<TDIContainer>
) => ApiHandlersRegistry<TDef, TDIContainer, TPathParams> = InnerApiHandlersRegistry as any;
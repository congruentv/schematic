import { ApiContract, IApiContractDefinition, ValidateApiContractDefinition } from "./api_contract.js";
import { MethodEndpointHandlerRegistryEntry, OnHandlerRegisteredCallback } from "./api_handlers_registry_entry.js";
import { DIContainer } from "./di_container.js";
import { IHttpMethodEndpointDefinition, HttpMethodEndpoint, ValidateHttpMethodEndpointDefinition } from "./http_method_endpoint.js";

export function flatListAllRegistryEntries<
  TDef extends IApiContractDefinition & ValidateApiContractDefinition<TDef>,
  TDIContainer extends DIContainer
>(
  registry: ApiHandlersRegistry<TDef, TDIContainer>
): MethodEndpointHandlerRegistryEntry<any, any, any, any>[] {
  const entries: MethodEndpointHandlerRegistryEntry<any, any, any, any>[] = [];
  for (const key of Object.keys(registry)) {
    if (key === 'dicontainer') {
      continue;
    }
    const value = registry[key];
    if (value instanceof MethodEndpointHandlerRegistryEntry) {
      entries.push(value);
    } else if (typeof value === "object" && value !== null) {
      const innerEntries = flatListAllRegistryEntries(value as any);
      for (const entry of innerEntries) {
        entries.push(entry);
      }
    }
  }
  return entries;
}

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

export type GenericOnHandlerRegisteredCallback<TDIContainer extends DIContainer> = 
  OnHandlerRegisteredCallback<
    IHttpMethodEndpointDefinition & ValidateHttpMethodEndpointDefinition<IHttpMethodEndpointDefinition>, 
    TDIContainer,
    string
  >;

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
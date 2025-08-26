import { HttpMethodEndpoint } from "./http_method_endpoint.js";
import { HttpMethod } from "./http_method_type.js";

export function apiContract<const TDef extends IApiContractDefinition & ValidateApiContractDefinition<TDef>>(definition: TDef): ApiContract<TDef> {
  return new ApiContract<TDef>(definition);
}

export interface IApiContractDefinition {
  [key: string]: IApiContractDefinition | HttpMethodEndpoint<any>;
}

function isApiContractDefinition(obj: any): obj is IApiContractDefinition {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj) && Object.values(obj).every(
    value => value instanceof HttpMethodEndpoint || isApiContractDefinition(value)
  );
}

export type ValidateApiContractDefinition<T> = {
  [K in keyof T]: T[K] extends HttpMethodEndpoint<infer TEndpDef>
    ? K extends HttpMethod
      ? HttpMethodEndpoint<TEndpDef>
      : "❌ ERROR: HttpMethodEndpoint only allowed on HttpMethod key"
    : K extends HttpMethod
      ? " ❌ ERROR: method key must hold an HttpMethodEndpoint"
      : T[K] extends object
        ? ValidateApiContractDefinition<T[K]>
        : T[K];
};

export class ApiContract<const TDef extends IApiContractDefinition & ValidateApiContractDefinition<TDef>> {
  
  /** @internal */
  __DEF__: TDef;
  
  constructor(definition: TDef) {
    this.__DEF__ = definition;

    // TODO: would this help with anything?
    // this.__DEF__ = ApiContract._deepClone(definition, []) as TDef;
  }

  cloneDefinition(): TDef {
    return ApiContract._deepClone(this.__DEF__, []) as TDef;
  }

  private static _deepClone(
    definition: IApiContractDefinition,
    path: readonly string[]
  ): IApiContractDefinition {
    const result: IApiContractDefinition = {};
    for (const key in definition) {
      const value = definition[key];
      if (value instanceof HttpMethodEndpoint) {
        result[key] = value._cloneWith(path, key);
      } else if (isApiContractDefinition(value)) {
        result[key] = ApiContract._deepClone(value, [...path, key]);
      }
    }
    return result;
  }
}
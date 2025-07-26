import { MethodEndpoint } from "./http_method_endpoint.js";

export interface IApiContractDefinition {
  [key: string]: IApiContractDefinition | MethodEndpoint<any>;
}

function isApiContractDefinition(obj: any): obj is IApiContractDefinition {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj) && Object.values(obj).every(
    value => value instanceof MethodEndpoint || isApiContractDefinition(value)
  );
}

export class ApiContract<const TDef extends IApiContractDefinition> {
  private __DEF__: TDef;
  
  /** @internal */
  get _DEFINITION(): TDef {
    return this.__DEF__;
  }
  
  constructor(definition: TDef) {
    this.__DEF__ = definition;

    // TODO: would this help with anything?
    // this.__DEF__ = ApiContract._deepClone(definition, []) as TDef;
  }

  /** @internal */
  _cloneDefinition(): TDef {
    return ApiContract._deepClone(this.__DEF__, []) as TDef;
  }

  private static _deepClone(
    definition: IApiContractDefinition,
    path: readonly string[]
  ): IApiContractDefinition {
    const result: IApiContractDefinition = {};
    for (const key in definition) {
      const value = definition[key];
      if (value instanceof MethodEndpoint) {
        result[key] = value._cloneWith(path, key);
      } else if (isApiContractDefinition(value)) {
        result[key] = ApiContract._deepClone(value, [...path, key]);
      }
    }
    return result;
  }
}
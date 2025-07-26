import { z } from 'zod';
import { StatusCode } from './http_status_code.js';
import { Method } from './http_method_type.js';

export interface IMethodEndpointDefinition {
  query?: z.ZodType;
  body?: z.ZodType;
  responses: MethodEndpointResponses;
}

export class MethodEndpoint<const TDef extends IMethodEndpointDefinition> {
  private _definition: TDef;
  get definition(): TDef {
    return this._definition;
  }

  private _pathSegments: readonly string[] = [];
  get pathSegments(): readonly string[] {
    return this._pathSegments;
  }

  private _cachedGenericPath: string | null = null;
  get genericPath(): string {
    if (!this._cachedGenericPath) {
      this._cachedGenericPath = `/${this._pathSegments.join('/')}`;
    }
    return this._cachedGenericPath;
  }

  private _method: Method = null as any;
  get method(): Method {
    return this._method;
  }

  constructor(definition: TDef) {
    this._definition = definition;
  }

  /** @internal */
  _cloneWith(path: readonly string[], method: string): MethodEndpoint<TDef> {
    const result = new MethodEndpoint<TDef>({
      query: !!this._definition.query ? this._definition.query.clone() : undefined,
      body: !!this._definition.body ? this._definition.body.clone() : undefined,
      responses: Object.fromEntries(
        Object.entries(this._definition.responses).map(([status, response]) => [
          status,
          response._clone(),
        ])
      )
    } as TDef);
    result._pathSegments = path;
    result._method = method as Method;
    return result;
  }
}

export class MethodEndpointResponse<_TStatus extends StatusCode, TPayloadSchema extends z.ZodType = z.ZodType> {
  private _payloadSchema: TPayloadSchema;
  get payloadSchema(): TPayloadSchema {
    return this._payloadSchema;
  }

  constructor(payloadSchema: TPayloadSchema) {
    this._payloadSchema = payloadSchema;
  }

  /** @internal */
  _clone(): MethodEndpointResponse<_TStatus, TPayloadSchema> {
    return new MethodEndpointResponse<_TStatus, TPayloadSchema>(this._payloadSchema.clone());
  }
}

export type MethodEndpointResponses = Partial<{
  [status in StatusCode]: MethodEndpointResponse<status, any>;
}>;
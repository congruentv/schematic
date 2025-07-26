import { z } from 'zod';
import { IMethodEndpointDefinition, MethodEndpointResponse } from "./http_method_endpoint.js";
import { StatusCode } from './http_status_code.js';

export type MethodEndpointHandlerOutput<TEndpointDefinition extends IMethodEndpointDefinition> = {
  [K in keyof TEndpointDefinition['responses'] & StatusCode]: {
    code: K;
    payload: TEndpointDefinition['responses'][K] extends MethodEndpointResponse<any, infer TPayloadSchema>
      ? TPayloadSchema extends z.ZodType
        ? z.infer<TPayloadSchema>
        : never
      : never;
  };
}[keyof TEndpointDefinition['responses'] & StatusCode];

export type ClientMethodEndpointHandlerOutput = {
  code: StatusCode;
  payload: any;
}
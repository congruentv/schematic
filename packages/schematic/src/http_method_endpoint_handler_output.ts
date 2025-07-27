import { z } from 'zod';
import { IHttpMethodEndpointDefinition, HttpMethodEndpointResponse } from "./http_method_endpoint.js";
import { HttpStatusCode } from './http_status_code.js';

export type HttpMethodEndpointHandlerOutput<TEndpointDefinition extends IHttpMethodEndpointDefinition> = {
  [K in keyof TEndpointDefinition['responses'] & HttpStatusCode]: {
    code: K;
    payload: TEndpointDefinition['responses'][K] extends HttpMethodEndpointResponse<any, infer TPayloadSchema>
      ? TPayloadSchema extends z.ZodType
        ? z.infer<TPayloadSchema>
        : never
      : never;
  };
}[keyof TEndpointDefinition['responses'] & HttpStatusCode];

export type ClientHttpMethodEndpointHandlerOutput = {
  code: HttpStatusCode;
  payload: any;
}
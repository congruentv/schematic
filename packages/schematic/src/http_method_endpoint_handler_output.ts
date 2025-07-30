import { z } from 'zod';
import { IHttpMethodEndpointDefinition } from "./http_method_endpoint.js";
import { HttpStatusCode } from './http_status_code.js';
import { HttpMethodEndpointResponse } from './http_method_endpoint_response.js';

export type HttpMethodEndpointHandlerOutput<TEndpointDefinition extends IHttpMethodEndpointDefinition> = {
  [THttpStatusCode in keyof TEndpointDefinition['responses'] & HttpStatusCode]: {
    code: THttpStatusCode;
    body: TEndpointDefinition['responses'][THttpStatusCode] extends HttpMethodEndpointResponse<THttpStatusCode, infer TRespDef>
      ? TRespDef['body'] extends z.ZodType
        ? z.input<TRespDef['body']> // z.input was used just in case validation of the response body is needed
        : undefined
      : undefined;
  };
}[keyof TEndpointDefinition['responses'] & HttpStatusCode];

export type ClientHttpMethodEndpointHandlerOutput = {
  code: HttpStatusCode;
  body: any;
}
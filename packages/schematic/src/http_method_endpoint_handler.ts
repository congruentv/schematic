import { IHttpMethodEndpointDefinition } from "./http_method_endpoint.js";
import { ClientHttpMethodEndpointHandlerInput, HttpMethodEndpointHandlerInput } from "./http_method_endpoint_handler_input.js";
import { ClientHttpMethodEndpointHandlerOutput, HttpMethodEndpointHandlerOutput } from "./http_method_endpoint_handler_output.js";

export type HttpMethodEndpointHandler<TDef extends IHttpMethodEndpointDefinition> = 
  (input: HttpMethodEndpointHandlerInput<TDef>) => Promise<HttpMethodEndpointHandlerOutput<TDef>>;

export type ClientHttpMethodEndpointHandler = 
  (input: ClientHttpMethodEndpointHandlerInput) => Promise<ClientHttpMethodEndpointHandlerOutput>;
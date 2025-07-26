import { IMethodEndpointDefinition } from "./http_method_endpoint.js";
import { ClientMethodEndpointHandlerInput, MethodEndpointHandlerInput } from "./http_method_endpoint_handler_input.js";
import { ClientMethodEndpointHandlerOutput, MethodEndpointHandlerOutput } from "./http_method_endpoint_handler_output.js";

export type MethodEndpointHandler<TEndpointDefinition extends IMethodEndpointDefinition> = 
  (input: MethodEndpointHandlerInput<TEndpointDefinition>) => Promise<MethodEndpointHandlerOutput<TEndpointDefinition>>;

export type ClientMethodEndpointHandler = 
  (input: ClientMethodEndpointHandlerInput) => Promise<ClientMethodEndpointHandlerOutput>;
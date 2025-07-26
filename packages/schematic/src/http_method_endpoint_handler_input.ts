import { z } from "zod";
import { IMethodEndpointDefinition } from "./http_method_endpoint.js";
import { Method } from "./http_method_type.js";

export type MethodEndpointHandlerInput<TEndpointDefinition extends IMethodEndpointDefinition> = {
  method: Method;
  pathSegments: readonly string[];
  path: string;
  genericPath: string;
  headers: Record<string, string>;
  pathParams: Record<string, string>;
  query: TEndpointDefinition['query'] extends z.ZodType ? z.infer<TEndpointDefinition['query']> : null;
  body: TEndpointDefinition['body'] extends z.ZodType ? z.infer<TEndpointDefinition['body']> : null;
};

export type ClientMethodEndpointHandlerInput = {
  method: Method;
  pathSegments: readonly string[];
  path: string;
  genericPath: string;
  headers: Record<string, string>;
  pathParams: Record<string, string>;
  query?: any;
  body?: any;
};
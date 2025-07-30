import { z } from "zod";
import { IHttpMethodEndpointDefinition } from "./http_method_endpoint.js";
import { HttpMethod } from "./http_method_type.js";

export type HttpMethodEndpointHandlerInput<TEndpointDefinition extends IHttpMethodEndpointDefinition> = {
  method: HttpMethod;
  pathSegments: readonly string[];
  path: string;
  genericPath: string;
  headers: Record<string, string>;
  pathParams: Record<string, string>;
  query: TEndpointDefinition['query'] extends z.ZodType ? z.output<TEndpointDefinition['query']> : null; // z.output because the handler receives the parsed input
  body: TEndpointDefinition['body'] extends z.ZodType ? z.output<TEndpointDefinition['body']> : null; // z.output because the handler receives the parsed input
};

export type ClientHttpMethodEndpointHandlerInput = {
  method: HttpMethod;
  pathSegments: readonly string[];
  path: string;
  genericPath: string;
  headers: Record<string, string>;
  pathParams: Record<string, string>;
  query?: any;
  body?: any;
};
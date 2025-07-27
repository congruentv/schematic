import { z } from "zod";
import { IHttpMethodEndpointDefinition } from "./http_method_endpoint.js";
import { HttpMethodEndpointHandlerOutput } from "./http_method_endpoint_handler_output.js";

export type HttpMethodCallInput<T extends IHttpMethodEndpointDefinition> =
  // 1) you declared a `query:` schema?
  T['query'] extends z.ZodType<any, any>
    ? (
        // 1a) …and also a `body:` schema?
        T['body'] extends z.ZodType<any, any>
          ? { query: z.infer<T['query']>; body: z.infer<T['body']> }
          // 1b) …no body schema
          : { query: z.infer<T['query']> }
      )
    // 2) you didn’t declare a query…
    : T['body'] extends z.ZodType<any, any>
      // 2a) …but you did declare a body schema
      ? { body: z.infer<T['body']> }
      // 2b) neither query nor body: never
      : never;

export type HttpMethodCallFunc<T extends IHttpMethodEndpointDefinition> = 
  HttpMethodCallInput<T> extends never
    ? () => Promise<HttpMethodEndpointHandlerOutput<T>>
    : (input: HttpMethodCallInput<T>) => Promise<HttpMethodEndpointHandlerOutput<T>>;
import { z } from "zod";
import { IHttpMethodEndpointDefinition } from "./http_method_endpoint.js";
import { HttpMethodEndpointHandlerOutput } from "./http_method_endpoint_handler_output.js";

//// <old implementation, kept for reference>
// export type HttpMethodCallInput<T extends IHttpMethodEndpointDefinition> =
//   // 1) you declared a `query:` schema?
//   T['query'] extends z.ZodType<any, any>
//     ? (
//         // 1a) …and also a `body:` schema?
//         T['body'] extends z.ZodType<any, any>
//           ? { query: z.infer<T['query']>; body: z.infer<T['body']> }
//           // 1b) …no body schema
//           : { query: z.infer<T['query']> }
//       )
//     // 2) you didn’t declare a query…
//     : T['body'] extends z.ZodType<any, any>
//       // 2a) …but you did declare a body schema
//       ? { body: z.infer<T['body']> }
//       // 2b) neither query nor body: never
//       : never;
//// </old implementation, kept for reference>


// 1) Helper: “If T[P] is a Zod schema, produce { [P]: z.infer<…> }, else {}”
type InferProp<
  T extends IHttpMethodEndpointDefinition,
  P extends keyof T
> = T[P] extends z.ZodType<any, any>
  ? Record<P, z.infer<T[P]>>
  : {};

// 2) Merge three of them:
type Merge3<A, B, C> = A & B & C;

// 3) Build the input, then test “did we get any props at all?”
export type HttpMethodCallInput<
  T extends IHttpMethodEndpointDefinition
> = Merge3<
    InferProp<T, "query">,
    InferProp<T, "body">,
    InferProp<T, "headers">
  > extends infer M                       // infer the merged object
    ? keyof M extends never              // if it has no keys…
      ? never                            // → you declared nothing
      : M                                // otherwise → that’s your input
    : never;

export type HttpMethodCallFunc<T extends IHttpMethodEndpointDefinition> = 
  HttpMethodCallInput<T> extends never
    ? () => Promise<HttpMethodEndpointHandlerOutput<T>>
    : (input: HttpMethodCallInput<T>) => Promise<HttpMethodEndpointHandlerOutput<T>>;
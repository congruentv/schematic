// Utility types for extracting path parameters from API definitions

/**
 * Extract path parameter names from a path string
 * Examples:
 * - "/users/:id" -> "id"
 * - "/users/:userId/posts/:postId" -> "userId" | "postId"
 */
export type ExtractPathParams<TPath extends string> = 
  TPath extends `${infer _Before}:${infer Param}/${infer Rest}`
    ? Param | ExtractPathParams<`/${Rest}`>
    : TPath extends `${infer _Before}:${infer Param}`
    ? Param
    : never;

/**
 * Extract path parameters from a specific endpoint path in the API definition
 * This is a simpler approach that just extracts parameter names from the path string
 */
export type ExtractPathParamsFromPath<
  TPath extends string
> = TPath extends `${infer _Method} ${infer Path}`
  ? ExtractPathParams<Path>
  : never;

// /**
//  * Extract path parameter names from a list of path segments
//  * This is simpler and more direct for runtime path segments
//  */
// export type ExtractPathParamsFromPathSegments<TSegments extends readonly string[]> = 
//   TSegments extends readonly [infer First extends string, ...infer Rest extends readonly string[]]
//     ? First extends `:${infer ParamName}`
//       ? ParamName | ExtractPathParamsFromPathSegments<Rest>
//       : ExtractPathParamsFromPathSegments<Rest>
//     : never;

/**
 * Create a typed path params record from extracted parameter names
 * This creates a single record with all parameters as properties, not a union of records
 * Uses tuple trick to prevent conditional type distribution over unions
 */
export type TypedPathParams<TParams extends string> = [TParams] extends [never]
  ? {} // Empty object instead of Record<string, never> to prevent any property access
  : {
      [P in TParams]: string
    };

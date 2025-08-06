export type TypedPathParams<TPathParams extends string> = 
  TPathParams extends `:${infer ParamName}:${infer RestParams}`
    ? { [K in ParamName]: string } & TypedPathParams<`:${RestParams}`>
    : TPathParams extends `:${infer ParamName}`
      ? { [K in ParamName]: string }
      : {};

// // Test cases to ensure the type works correctly
// const typedParams1: TypedPathParams<':id'> = { 
//   id: '', 
//   //foo: 'bar' // This should error
// };
// typedParams1.id

// const typedParams2: TypedPathParams<':id:name'> = {
//   id: '',
//   name: ''
// };
// typedParams2.id
// typedParams2.name

// const typedParams3: TypedPathParams<':id:name:age'> = {
//   id: '',
//   name: '',
//   age: ''
// };
// typedParams3.id
// typedParams3.name
// typedParams3.age

// Extract path parameters from a path string like "DELETE /pokemon/:id" -> ":id"
export type ExtractPathParamsFromPath<TPath extends string> = 
  TPath extends `${string} ${infer PathPart}`
    ? ExtractPathParamsFromPathSegments<PathPart>
    : never;

type ExtractPathParamsFromPathSegments<TPath extends string> = 
  TPath extends `/${infer Segment}/${infer Rest}`
    ? Segment extends `:${infer ParamName}`
      ? `:${ParamName}${ExtractPathParamsFromPathSegments<`/${Rest}`> extends `:${infer RestParams}` ? `:${RestParams}` : ""}`
      : ExtractPathParamsFromPathSegments<`/${Rest}`>
    : TPath extends `/${infer Segment}`
      ? Segment extends `:${infer ParamName}`
        ? `:${ParamName}`
        : ""
    : "";
import { Express } from 'express';
import { 
  HttpMethodEndpointHandler,
  MethodEndpointHandlerRegistryEntry, 
  IHttpMethodEndpointDefinition,
  type LowerCasedHttpMethod,
  ValidateHttpMethodEndpointDefinition,
  ApiHandlersRegistry,
  IApiContractDefinition,
  ValidateApiContractDefinition,
  HttpMethodEndpoint,
  HttpMethod,
  routeByPathSegments
} from '@congruentv/schematic';

export function register<const TDef extends IHttpMethodEndpointDefinition & ValidateHttpMethodEndpointDefinition<TDef>>(
  app: Express, 
  endpointEntry: MethodEndpointHandlerRegistryEntry<TDef>,
  handler: HttpMethodEndpointHandler<TDef>
) {
  endpointEntry.handle(handler);
  const { genericPath } = endpointEntry.methodEndpoint;
  const method = endpointEntry.methodEndpoint.method.toLowerCase() as LowerCasedHttpMethod;
  app[method](genericPath, async (req, res, _next) => {
    const pathParams = req.params;
    const query = req.query;
    const body = req.body;
    const headers = JSON.parse(JSON.stringify(req.headers)); // Convert headers to a plain object
    const result = await endpointEntry.trigger({
      headers,
      pathParams,
      query,
      body,
    });
    res.status(result.code).json(result.body);
  });
}

// Type to extract the endpoint definition from a method-first path
export type ExtractEndpointFromPath<
  TApiDef,
  TPath extends string
> = TPath extends `${infer Method} ${infer Path}`
  ? ExtractEndpointFromPathSegments<TApiDef, Path, Method>
  : never;

// Type to navigate through path segments and extract the endpoint
type ExtractEndpointFromPathSegments<
  TDef,
  TPath extends string,
  TMethod extends string,
  TSegments extends readonly string[] = SplitPath<TPath>
> = NavigateToEndpoint<TDef, TSegments> extends infer TEndpointContainer
  ? TEndpointContainer extends Record<string, any>
    ? TMethod extends keyof TEndpointContainer
      ? TEndpointContainer[TMethod] extends HttpMethodEndpoint<infer TEndpointDef>
        ? TEndpointDef
        : never
      : never
    : never
  : never;

// Type to split a path like '/pokemon/:id' into ['pokemon', ':id']
type SplitPath<TPath extends string> = TPath extends `/${infer Rest}`
  ? SplitPathSegments<Rest>
  : SplitPathSegments<TPath>;

type SplitPathSegments<TPath extends string> = TPath extends `${infer First}/${infer Rest}`
  ? [First, ...SplitPathSegments<Rest>]
  : TPath extends ""
  ? []
  : [TPath];

// Type to navigate through the API definition using path segments
type NavigateToEndpoint<TDef, TSegments extends readonly string[]> = TSegments extends readonly [
  infer First extends string,
  ...infer Rest extends readonly string[]
]
  ? First extends keyof TDef
    ? NavigateToEndpoint<TDef[First], Rest>
    : never
  : TDef;

export function path<
  TApiDef extends IApiContractDefinition & ValidateApiContractDefinition<TApiDef>,
  const TPath extends MethodFirstPath<TApiDef>
>(
  apiReg: ApiHandlersRegistry<TApiDef>,
  path: TPath
): MethodEndpointHandlerRegistryEntry<ExtractEndpointFromPath<TApiDef, TPath>> {
  // Parse the method and path from the input string
  const pathStr = path as string;
  const spaceIndex = pathStr.indexOf(' ');
  if (spaceIndex === -1) {
    throw new Error(`Invalid path format: ${pathStr}. Expected format: "METHOD /path"`);
  }
  
  const method = pathStr.substring(0, spaceIndex) as HttpMethod;
  const urlPath = pathStr.substring(spaceIndex + 1);
  
  // Split the path into segments
  const pathSegments = urlPath.split('/').filter((segment: string) => segment.length > 0);
  
  // Navigate through the API registry to find the endpoint
  return routeByPathSegments(apiReg, pathSegments, method) as MethodEndpointHandlerRegistryEntry<ExtractEndpointFromPath<TApiDef, TPath>>;
}

export type MethodFirstPath<TDef, BasePath extends string = ""> = {
  [K in keyof TDef & string]:
    TDef[K] extends HttpMethodEndpoint<infer _TEndpointDef>
      ? `${K} ${BasePath}`
      : TDef[K] extends object
        ? MethodFirstPath<TDef[K], `${BasePath}/${K}`>
        : never
}[keyof TDef & string];


//// <old implementation, kept for reference>
// export type LeafPaths<TDef> = {
//   [K in keyof TDef & string]:
//     TDef[K] extends HttpMethodEndpoint<infer _TEndpointDef>
//       ? `/${K}`
//       : TDef[K] extends object
//         ? `${`/${K}`}${LeafPaths<TDef[K]>}`
//         : never
// }[keyof TDef & string];
//// </old implementation, kept for reference>

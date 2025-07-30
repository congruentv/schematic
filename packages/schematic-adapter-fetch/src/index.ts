import { 
  ApiClient, 
  HttpStatusCode, 
  type IApiContractDefinition, 
  ApiContract} from '@congruentv/schematic';

export interface IClientOptions {
  baseUrl: string | (() => string);
  headers?: Record<string, string> | (() => Record<string, string>);
}

export function createClient<TDef extends IApiContractDefinition>(contract: ApiContract<TDef>, options: IClientOptions) {
  const apiClient = new ApiClient(contract, async ({ headers, method, path, pathParams, query, body }) => {
    const urlParams = new URLSearchParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) {
        urlParams.append(key, String(value));
      }
    }
    const finalPath = Object.entries(pathParams ?? {}).reduce((acc, [key, value]) => {
      return acc.replace(`:${key}`, encodeURIComponent(String(value)));
    }, path);
    const urlParamsString = urlParams.toString();
    const finalFullPath = finalPath + (urlParamsString ? `?${urlParamsString}` : '');
    const baseUrl = typeof options.baseUrl === 'function' ? options.baseUrl() : options.baseUrl;
    const fullUrlAddress = new URL(finalFullPath, baseUrl);
    const optionHeaders = typeof options.headers === 'function' ? options.headers() : options.headers;
    const finalHeaders = { ...optionHeaders, ...headers };
    const requestInit: RequestInit = {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
    };
    const response = await fetch(fullUrlAddress, requestInit);
    const responseCode = response.status as HttpStatusCode;
    const responseBody = responseCode === HttpStatusCode.NoContent_204 // TODO: Use a more robust check for empty body
      ? undefined 
      : await response.json();
    return {
      code: responseCode,
      body: responseBody,
    };
  });
  return apiClient;
}

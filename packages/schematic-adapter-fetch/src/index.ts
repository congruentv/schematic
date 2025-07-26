import { 
  ApiClient, 
  type IApiContractDefinition, 
  ApiContract, 
  type StatusCode 
} from '@congruentv/schematic';

export interface IClientOptions {
  baseUrl: string;
}

export function createClient<TDef extends IApiContractDefinition>(contract: ApiContract<TDef>, options: IClientOptions) {
  const apiClient = new ApiClient(contract, async ({ method, path, pathParams, query, headers, body }) => {
    const urlParams = new URLSearchParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) {
        urlParams.append(key, String(value));
      }
    }
    const finalPath = Object.entries(pathParams ?? {}).reduce((acc, [key, value]) => {
      return acc.replace(`:${key}`, encodeURIComponent(String(value)));
    }, path);
    const fullUrlAddress = new URL(`${finalPath}?${urlParams.toString()}`, options.baseUrl);
    const response = await fetch(fullUrlAddress, {
      method,
      headers,
      body,
    });
    const code = response.status as StatusCode;
    const payload = await response.json();
    return {
      code,
      payload,
    // eslint-disable-next-line
    } as any;
  });
  return apiClient;
}
